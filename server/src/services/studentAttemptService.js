import { AttemptStatus, Prisma, QuestionType } from '@prisma/client'
import { AppError } from '../utils/AppError.js'
import { evaluateSubmittedAttempt } from './attemptEvaluationService.js'
import { publishResultNotificationSafely } from './notificationDeliveryService.js'
import {
  ATTEMPT_STATE_SELECT,
  assertAttemptOwner,
  attemptNotInProgressError,
  attemptStateConflictError,
  attemptTimeExpiredError,
  autoFinalizeExpiredAttempt,
  loadStudentAttemptView,
  runStudentAttemptTransaction,
  toStudentAttemptView,
} from './studentAttemptSupport.js'

const CHOICE_QUESTION_TYPES = new Set([QuestionType.MCQ, QuestionType.TRUE_FALSE])
const OPEN_QUESTION_TYPES = new Set([
  QuestionType.CODING,
  QuestionType.ESSAY,
  QuestionType.FILL_BLANK,
  QuestionType.SHORT_ANSWER,
])

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

async function inspectActiveAttempt({ attemptId, now, studentId, transaction }) {
  const attempt = await transaction.examAttempt.findUnique({
    select: ATTEMPT_STATE_SELECT,
    where: { id: attemptId },
  })

  assertAttemptOwner(attempt, studentId)

  if (attempt.status === AttemptStatus.AUTO_SUBMITTED) {
    return { attempt, expired: true, notificationAttemptId: null }
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw attemptNotInProgressError()
  }

  const expiration = await autoFinalizeExpiredAttempt({ attempt, now, transaction })
  return { attempt, ...expiration }
}

function answerTypeMismatchError(type) {
  return new AppError(
    `${type} questions require the matching answer format`,
    400,
    'ANSWER_TYPE_MISMATCH',
  )
}

function questionNotInAttemptError() {
  return new AppError(
    'The question is not part of this exam attempt',
    400,
    'QUESTION_NOT_IN_ATTEMPT',
  )
}

export async function getStudentAttempt({ attemptId, studentId }) {
  const outcome = await runStudentAttemptTransaction(async (transaction) => {
    const active = await inspectActiveAttempt({
      attemptId,
      now: new Date(),
      studentId,
      transaction,
    })

    if (active.expired) {
      return {
        kind: 'expired',
        notificationAttemptId: active.notificationAttemptId,
      }
    }

    const attempt = await loadStudentAttemptView(attemptId, studentId, transaction)
    return { attempt: toStudentAttemptView(attempt), kind: 'active' }
  })

  if (outcome.notificationAttemptId) {
    await publishResultNotificationSafely(outcome.notificationAttemptId)
  }

  if (outcome.kind === 'expired') {
    throw attemptTimeExpiredError()
  }

  return outcome.attempt
}

export async function saveStudentAnswer({ answer, attemptId, studentId }) {
  try {
    const outcome = await runStudentAttemptTransaction(async (transaction) => {
      const active = await inspectActiveAttempt({
        attemptId,
        now: new Date(),
        studentId,
        transaction,
      })

      if (active.expired) {
        return {
          kind: 'expired',
          notificationAttemptId: active.notificationAttemptId,
        }
      }

      const attemptQuestion = await transaction.attemptQuestion.findUnique({
        select: {
          options: { select: { optionId: true } },
          question: { select: { type: true } },
        },
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: answer.questionId,
          },
        },
      })

      if (!attemptQuestion) {
        throw questionNotInAttemptError()
      }

      const questionType = attemptQuestion.question.type
      let answerData

      if (CHOICE_QUESTION_TYPES.has(questionType)) {
        if (!answer.selectedOptionId || answer.answerText !== null) {
          throw answerTypeMismatchError(questionType)
        }

        if (
          !attemptQuestion.options.some((option) => option.optionId === answer.selectedOptionId)
        ) {
          throw new AppError(
            'The selected option does not belong to this question',
            400,
            'OPTION_NOT_IN_QUESTION',
          )
        }

        answerData = { answerText: null, selectedOptionId: answer.selectedOptionId }
      } else if (OPEN_QUESTION_TYPES.has(questionType)) {
        if (answer.selectedOptionId !== null || !answer.answerText?.trim()) {
          throw answerTypeMismatchError(questionType)
        }

        answerData = { answerText: answer.answerText, selectedOptionId: null }
      } else {
        throw new AppError('Unsupported question type', 400, 'UNSUPPORTED_QUESTION_TYPE')
      }

      const saved = await transaction.studentAnswer.upsert({
        create: {
          ...answerData,
          attemptId,
          isCorrect: null,
          marksAwarded: null,
          needsManualReview: false,
          questionId: answer.questionId,
        },
        select: {
          answerText: true,
          questionId: true,
          selectedOptionId: true,
        },
        update: {
          ...answerData,
          isCorrect: null,
          marksAwarded: null,
          needsManualReview: false,
        },
        where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
      })

      return { answer: saved, kind: 'saved' }
    })

    if (outcome.notificationAttemptId) {
      await publishResultNotificationSafely(outcome.notificationAttemptId)
    }

    if (outcome.kind === 'expired') {
      throw attemptTimeExpiredError()
    }

    return outcome.answer
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      throw new AppError(
        'The answer changed concurrently. Please retry.',
        409,
        'ANSWER_SAVE_CONFLICT',
      )
    }

    if (isPrismaError(error, 'P2003') || isPrismaError(error, 'P2025')) {
      throw new AppError(
        'The question or option changed while saving the answer',
        409,
        'ANSWER_SAVE_CONFLICT',
      )
    }

    throw error
  }
}

export async function submitStudentAttempt({ attemptId, studentId }) {
  const outcome = await runStudentAttemptTransaction(async (transaction) => {
    const now = new Date()
    const active = await inspectActiveAttempt({ attemptId, now, studentId, transaction })

    if (active.expired) {
      return {
        kind: 'expired',
        notificationAttemptId: active.notificationAttemptId,
      }
    }

    const maximumSeconds = active.attempt.exam.durationMinutes * 60
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - active.attempt.startedAt.getTime()) / 1_000),
    )
    const update = await transaction.examAttempt.updateMany({
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: now,
        timeTakenSeconds: Math.min(maximumSeconds, elapsedSeconds),
      },
      where: {
        id: attemptId,
        status: AttemptStatus.IN_PROGRESS,
        studentId,
      },
    })

    if (update.count !== 1) {
      throw attemptStateConflictError()
    }

    const evaluation = await evaluateSubmittedAttempt({
      attemptId,
      evaluatedAt: now,
      transaction,
    })

    return {
      attempt: evaluation.attempt,
      kind: 'submitted',
      notificationAttemptId: evaluation.notificationAttemptId,
    }
  })

  if (outcome.notificationAttemptId) {
    await publishResultNotificationSafely(outcome.notificationAttemptId)
  }

  if (outcome.kind === 'expired') {
    throw attemptTimeExpiredError()
  }

  return outcome.attempt
}
