import { randomInt } from 'node:crypto'
import { AttemptStatus } from '@prisma/client'
import { AppError } from '../utils/AppError.js'
import { runSerializableTransaction } from '../utils/prismaTransactions.js'
import { evaluateSubmittedAttempt } from './attemptEvaluationService.js'

export const ATTEMPT_STATE_SELECT = {
  exam: { select: { durationMinutes: true } },
  examId: true,
  id: true,
  startedAt: true,
  status: true,
  studentId: true,
  submittedAt: true,
  timeTakenSeconds: true,
}

export const STUDENT_ATTEMPT_VIEW_SELECT = {
  answers: {
    orderBy: { questionId: 'asc' },
    select: {
      answerText: true,
      questionId: true,
      selectedOptionId: true,
    },
  },
  attemptQuestions: {
    orderBy: { order: 'asc' },
    select: {
      options: {
        orderBy: { order: 'asc' },
        select: {
          option: { select: { id: true, questionId: true, text: true } },
          order: true,
        },
      },
      order: true,
      question: {
        select: {
          difficulty: true,
          id: true,
          marks: true,
          text: true,
          type: true,
        },
      },
      questionId: true,
    },
  },
  exam: {
    select: {
      durationMinutes: true,
      endTime: true,
      examType: true,
      fullScreenRequired: true,
      id: true,
      passingMarks: true,
      questions: { select: { marksOverride: true, questionId: true } },
      shuffleOptions: true,
      shuffleQuestions: true,
      startTime: true,
      status: true,
      subject: { select: { code: true, id: true, name: true } },
      tabSwitchLimit: true,
      title: true,
      totalMarks: true,
      webcamRequired: true,
    },
  },
  examId: true,
  id: true,
  startedAt: true,
  status: true,
  studentId: true,
  submittedAt: true,
  timeTakenSeconds: true,
}

export function attemptNotFoundError() {
  return new AppError('Exam attempt not found', 404, 'ATTEMPT_NOT_FOUND')
}

export function attemptForbiddenError() {
  return new AppError('You can only access your own exam attempts', 403, 'FORBIDDEN')
}

export function attemptNotInProgressError() {
  return new AppError('Only an in-progress attempt can be changed', 409, 'ATTEMPT_NOT_IN_PROGRESS')
}

export function attemptTimeExpiredError() {
  return new AppError(
    'The exam time limit has expired and the attempt was auto-submitted',
    409,
    'ATTEMPT_TIME_EXPIRED',
  )
}

export function attemptStateConflictError() {
  return new AppError(
    'The attempt state changed concurrently. Please refresh and try again.',
    409,
    'ATTEMPT_STATE_CONFLICT',
  )
}

export function runStudentAttemptTransaction(operation) {
  return runSerializableTransaction(operation, {
    conflictCode: 'ATTEMPT_TRANSACTION_CONFLICT',
    conflictMessage: 'The exam attempt changed concurrently. Please retry.',
    timeoutCode: 'ATTEMPT_TRANSACTION_TIMEOUT',
    timeoutMessage: 'The exam attempt update could not complete in time. Please retry.',
  })
}

export function assertAttemptOwner(attempt, studentId) {
  if (!attempt) {
    throw attemptNotFoundError()
  }

  if (attempt.studentId !== studentId) {
    throw attemptForbiddenError()
  }
}

export function getAttemptDeadline(startedAt, durationMinutes) {
  return new Date(startedAt.getTime() + durationMinutes * 60_000)
}

export function hasAttemptExpired(attempt, now) {
  return (
    now.getTime() > getAttemptDeadline(attempt.startedAt, attempt.exam.durationMinutes).getTime()
  )
}

export async function autoFinalizeExpiredAttempt({ attempt, now, transaction }) {
  if (!hasAttemptExpired(attempt, now)) {
    return { expired: false, notificationAttemptId: null }
  }

  const deadlineAt = getAttemptDeadline(attempt.startedAt, attempt.exam.durationMinutes)
  const update = await transaction.examAttempt.updateMany({
    data: {
      status: AttemptStatus.AUTO_SUBMITTED,
      submittedAt: deadlineAt,
      timeTakenSeconds: attempt.exam.durationMinutes * 60,
    },
    where: {
      id: attempt.id,
      status: AttemptStatus.IN_PROGRESS,
      studentId: attempt.studentId,
    },
  })

  if (update.count !== 1) {
    throw attemptStateConflictError()
  }

  const evaluation = await evaluateSubmittedAttempt({
    attemptId: attempt.id,
    evaluatedAt: now,
    transaction,
  })

  return {
    expired: true,
    notificationAttemptId: evaluation.notificationAttemptId,
  }
}

function shuffle(values) {
  const shuffled = [...values]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    const currentValue = shuffled[index]

    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = currentValue
  }

  return shuffled
}

export function buildAttemptPresentation({ attemptId, exam }) {
  const orderedQuestions = exam.shuffleQuestions ? shuffle(exam.questions) : exam.questions
  const attemptQuestions = []
  const attemptQuestionOptions = []

  orderedQuestions.forEach((attachment, questionOrder) => {
    attemptQuestions.push({
      attemptId,
      order: questionOrder,
      questionId: attachment.questionId,
    })

    const orderedOptions = exam.shuffleOptions
      ? shuffle(attachment.question.options)
      : attachment.question.options

    orderedOptions.forEach((option, optionOrder) => {
      attemptQuestionOptions.push({
        attemptId,
        optionId: option.id,
        order: optionOrder,
        questionId: attachment.questionId,
      })
    })
  })

  return { attemptQuestionOptions, attemptQuestions }
}

export async function loadStudentAttemptView(attemptId, studentId, transaction) {
  const attempt = await transaction.examAttempt.findUnique({
    select: STUDENT_ATTEMPT_VIEW_SELECT,
    where: { id: attemptId },
  })

  assertAttemptOwner(attempt, studentId)
  return attempt
}

export function toStudentExamMetadata(exam) {
  return {
    durationMinutes: exam.durationMinutes,
    fullScreenRequired: exam.fullScreenRequired,
    id: exam.id,
    passingMarks: exam.passingMarks,
    scheduledEnd: exam.endTime,
    scheduledStart: exam.startTime,
    shuffleOptions: exam.shuffleOptions,
    shuffleQuestions: exam.shuffleQuestions,
    status: exam.status,
    subject: exam.subject,
    tabSwitchLimit: exam.tabSwitchLimit,
    title: exam.title,
    totalMarks: exam.totalMarks,
    type: exam.examType,
    webcamMonitoring: exam.webcamRequired,
  }
}

export function toStudentAttemptView(attempt) {
  const attachmentByQuestion = new Map(
    attempt.exam.questions.map((attachment) => [attachment.questionId, attachment]),
  )

  if (
    attachmentByQuestion.size !== attempt.exam.questions.length ||
    attempt.attemptQuestions.length !== attachmentByQuestion.size
  ) {
    throw new AppError(
      'The saved attempt presentation is inconsistent with the exam',
      500,
      'ATTEMPT_PRESENTATION_INVALID',
    )
  }

  const questions = attempt.attemptQuestions.map((attemptQuestion, displayOrder) => {
    const attachment = attachmentByQuestion.get(attemptQuestion.questionId)

    if (!attachment || attemptQuestion.question.id !== attemptQuestion.questionId) {
      throw new AppError(
        'The saved attempt presentation contains an invalid question',
        500,
        'ATTEMPT_PRESENTATION_INVALID',
      )
    }

    const options = attemptQuestion.options.map((attemptOption, optionDisplayOrder) => {
      if (attemptOption.option.questionId !== attemptQuestion.questionId) {
        throw new AppError(
          'The saved attempt presentation contains an invalid option',
          500,
          'ATTEMPT_PRESENTATION_INVALID',
        )
      }

      return {
        id: attemptOption.option.id,
        order: optionDisplayOrder,
        text: attemptOption.option.text,
      }
    })

    return {
      content: attemptQuestion.question.text,
      difficulty: attemptQuestion.question.difficulty,
      id: attemptQuestion.question.id,
      marks: attachment.marksOverride ?? attemptQuestion.question.marks,
      options,
      order: displayOrder,
      type: attemptQuestion.question.type,
    }
  })

  const answerByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]))
  const answers = questions
    .map((question) => answerByQuestion.get(question.id))
    .filter(Boolean)
    .map((answer) => ({
      answerText: answer.answerText,
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
    }))

  return {
    answers,
    deadlineAt: getAttemptDeadline(attempt.startedAt, attempt.exam.durationMinutes),
    exam: toStudentExamMetadata(attempt.exam),
    id: attempt.id,
    questions,
    startedAt: attempt.startedAt,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    timeTakenSeconds: attempt.timeTakenSeconds,
  }
}
