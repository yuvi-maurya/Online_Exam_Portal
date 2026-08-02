import { AttemptStatus, Prisma, QuestionType } from '@prisma/client'
import { AppError } from '../utils/AppError.js'
import { evaluateSubmittedAttempt } from './attemptEvaluationService.js'
import { runEvaluationPostCommitEffectsSafely } from './evaluationCompletionService.js'
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
    return {
      attempt,
      certificateAttemptId: null,
      expired: true,
      notificationAttemptId: null,
    }
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
        certificateAttemptId: active.certificateAttemptId,
        kind: 'expired',
        notificationAttemptId: active.notificationAttemptId,
      }
    }

    const attempt = await loadStudentAttemptView(attemptId, studentId, transaction)
    return { attempt: toStudentAttemptView(attempt), kind: 'active' }
  })

  if (outcome.notificationAttemptId || outcome.certificateAttemptId) {
    await runEvaluationPostCommitEffectsSafely(outcome)
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
          certificateAttemptId: active.certificateAttemptId,
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

    if (outcome.notificationAttemptId || outcome.certificateAttemptId) {
      await runEvaluationPostCommitEffectsSafely(outcome)
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
        certificateAttemptId: active.certificateAttemptId,
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
      certificateAttemptId: evaluation.certificateAttemptId,
      kind: 'submitted',
      notificationAttemptId: evaluation.notificationAttemptId,
    }
  })

  if (outcome.notificationAttemptId || outcome.certificateAttemptId) {
    await runEvaluationPostCommitEffectsSafely(outcome)
  }

  if (outcome.kind === 'expired') {
    throw attemptTimeExpiredError()
  }

  return outcome.attempt
}

function toViolationResult({ attempt, autoFinalized, limitExceeded, type }) {
  const tabSwitchLimit = attempt.exam.tabSwitchLimit

  return {
    autoFinalized,
    limitExceeded,
    remainingTabSwitches:
      tabSwitchLimit === null ? null : Math.max(tabSwitchLimit - attempt.tabSwitchCount, 0),
    status: attempt.status,
    tabSwitchCount: attempt.tabSwitchCount,
    tabSwitchLimit,
    type,
  }
}

export async function recordStudentAttemptViolation({ attemptId, studentId, type }) {
  const outcome = await runStudentAttemptTransaction(async (transaction) => {
    const now = new Date()
    const attempt = await transaction.examAttempt.findUnique({
      select: ATTEMPT_STATE_SELECT,
      where: { id: attemptId },
    })

    assertAttemptOwner(attempt, studentId)

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw attemptNotInProgressError()
    }

    const expiration = await autoFinalizeExpiredAttempt({ attempt, now, transaction })

    if (expiration.expired) {
      const finalizedAttempt = await transaction.examAttempt.findUniqueOrThrow({
        select: ATTEMPT_STATE_SELECT,
        where: { id: attemptId },
      })

      return {
        certificateAttemptId: expiration.certificateAttemptId,
        notificationAttemptId: expiration.notificationAttemptId,
        violation: toViolationResult({
          attempt: finalizedAttempt,
          autoFinalized: true,
          limitExceeded: false,
          type,
        }),
      }
    }

    const securityFeatureEnabled =
      type === 'FULLSCREEN_EXIT'
        ? attempt.exam.fullScreenRequired
        : attempt.exam.tabSwitchLimit !== null

    if (!securityFeatureEnabled) {
      throw new AppError(
        'This security feature is not enabled for the exam',
        409,
        'SECURITY_FEATURE_DISABLED',
      )
    }

    const increment = await transaction.examAttempt.updateMany({
      data: { tabSwitchCount: { increment: 1 } },
      where: {
        id: attemptId,
        status: AttemptStatus.IN_PROGRESS,
        studentId,
      },
    })

    if (increment.count !== 1) {
      throw attemptStateConflictError()
    }

    const incrementedAttempt = await transaction.examAttempt.findUniqueOrThrow({
      select: ATTEMPT_STATE_SELECT,
      where: { id: attemptId },
    })
    const tabSwitchLimit = incrementedAttempt.exam.tabSwitchLimit
    const limitExceeded =
      tabSwitchLimit !== null && incrementedAttempt.tabSwitchCount > tabSwitchLimit

    if (!limitExceeded) {
      return {
        certificateAttemptId: null,
        notificationAttemptId: null,
        violation: toViolationResult({
          attempt: incrementedAttempt,
          autoFinalized: false,
          limitExceeded: false,
          type,
        }),
      }
    }

    const maximumSeconds = incrementedAttempt.exam.durationMinutes * 60
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - incrementedAttempt.startedAt.getTime()) / 1_000),
    )
    const submission = await transaction.examAttempt.updateMany({
      data: {
        status: AttemptStatus.AUTO_SUBMITTED,
        submittedAt: now,
        timeTakenSeconds: Math.min(maximumSeconds, elapsedSeconds),
      },
      where: {
        id: attemptId,
        status: AttemptStatus.IN_PROGRESS,
        studentId,
      },
    })

    if (submission.count !== 1) {
      throw attemptStateConflictError()
    }

    const evaluation = await evaluateSubmittedAttempt({
      attemptId,
      evaluatedAt: now,
      transaction,
    })
    const finalizedAttempt = await transaction.examAttempt.findUniqueOrThrow({
      select: ATTEMPT_STATE_SELECT,
      where: { id: attemptId },
    })

    return {
      certificateAttemptId: evaluation.certificateAttemptId,
      notificationAttemptId: evaluation.notificationAttemptId,
      violation: toViolationResult({
        attempt: finalizedAttempt,
        autoFinalized: true,
        limitExceeded: true,
        type,
      }),
    }
  })

  if (outcome.notificationAttemptId || outcome.certificateAttemptId) {
    await runEvaluationPostCommitEffectsSafely(outcome)
  }

  return outcome.violation
}
