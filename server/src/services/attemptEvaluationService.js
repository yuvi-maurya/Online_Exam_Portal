import { AttemptResult, AttemptStatus, Prisma, QuestionType } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { runSerializableTransaction } from '../utils/prismaTransactions.js'
import { publishResultNotificationSafely } from './notificationDeliveryService.js'

const CHOICE_TYPES = new Set([QuestionType.MCQ, QuestionType.TRUE_FALSE])
const MANUAL_TYPES = new Set([QuestionType.CODING, QuestionType.ESSAY, QuestionType.SHORT_ANSWER])
const GRADABLE_ATTEMPT_STATUSES = [
  AttemptStatus.SUBMITTED,
  AttemptStatus.AUTO_SUBMITTED,
  AttemptStatus.EVALUATED,
]

const ATTEMPT_RESULT_SELECT = {
  evaluatedAt: true,
  id: true,
  percentage: true,
  rank: true,
  result: true,
  score: true,
  startedAt: true,
  status: true,
  submittedAt: true,
  timeTakenSeconds: true,
}

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

function runEvaluationTransaction(operation) {
  return runSerializableTransaction(operation, {
    conflictCode: 'EVALUATION_TRANSACTION_CONFLICT',
    conflictMessage: 'The evaluation changed concurrently. Please retry.',
    timeoutCode: 'EVALUATION_TRANSACTION_TIMEOUT',
    timeoutMessage: 'The evaluation could not complete in time. Please retry.',
  })
}

function attemptNotFoundError() {
  return new AppError('Exam attempt not found', 404, 'ATTEMPT_NOT_FOUND')
}

function examNotFoundError() {
  return new AppError('Exam not found', 404, 'EXAM_NOT_FOUND')
}

function teacherForbiddenError() {
  return new AppError('You can only grade attempts for exams you created', 403, 'FORBIDDEN')
}

function effectiveMarksByQuestion(exam) {
  return new Map(
    exam.questions.map((attachment) => [
      attachment.questionId,
      attachment.marksOverride ?? attachment.question.marks,
    ]),
  )
}

function normalizeAnswerText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

async function recomputeExamRanks(examId, transaction) {
  const evaluatedAttempts = await transaction.examAttempt.findMany({
    orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }, { id: 'asc' }],
    select: { id: true, score: true, submittedAt: true },
    where: { examId, status: AttemptStatus.EVALUATED },
  })

  for (const [index, attempt] of evaluatedAttempts.entries()) {
    if (attempt.score === null || attempt.submittedAt === null) {
      throw new AppError(
        'An evaluated attempt is missing ranking data',
        500,
        'EVALUATION_DATA_INVALID',
      )
    }

    await transaction.examAttempt.update({
      data: { rank: index + 1 },
      where: { id: attempt.id },
    })
  }
}

export async function finalizeAttemptIfFullyGraded({
  attemptId,
  evaluatedAt = new Date(),
  transaction,
}) {
  const attempt = await transaction.examAttempt.findUnique({
    select: {
      answers: { select: { marksAwarded: true } },
      exam: { select: { passingMarks: true, totalMarks: true } },
      examId: true,
      id: true,
      status: true,
    },
    where: { id: attemptId },
  })

  if (!attempt) {
    throw attemptNotFoundError()
  }

  if (!GRADABLE_ATTEMPT_STATUSES.includes(attempt.status)) {
    throw new AppError('Only submitted attempts can be evaluated', 409, 'ATTEMPT_NOT_SUBMITTED')
  }

  if (attempt.answers.some((answer) => answer.marksAwarded === null)) {
    return { finalized: false, transitionedToEvaluated: false }
  }

  if (attempt.exam.totalMarks <= 0) {
    throw new AppError('Exam total marks must be positive', 409, 'EXAM_MARKS_INVALID')
  }

  const score = attempt.answers.reduce((total, answer) => total + answer.marksAwarded, 0)

  if (!Number.isFinite(score) || score < 0 || score > attempt.exam.totalMarks) {
    throw new AppError('Awarded marks exceed the exam total', 409, 'EVALUATION_SCORE_INVALID')
  }

  const percentage = (score / attempt.exam.totalMarks) * 100
  const result = score >= attempt.exam.passingMarks ? AttemptResult.PASS : AttemptResult.FAIL
  const transitionedToEvaluated = attempt.status !== AttemptStatus.EVALUATED
  const update = await transaction.examAttempt.updateMany({
    data: {
      evaluatedAt,
      percentage,
      result,
      score,
      status: AttemptStatus.EVALUATED,
    },
    where: {
      id: attemptId,
      status: { in: GRADABLE_ATTEMPT_STATUSES },
    },
  })

  if (update.count !== 1) {
    throw new AppError(
      'The attempt state changed while it was being evaluated',
      409,
      'EVALUATION_STATE_CONFLICT',
    )
  }

  await recomputeExamRanks(attempt.examId, transaction)
  return { finalized: true, transitionedToEvaluated }
}

export async function evaluateSubmittedAttempt({
  attemptId,
  evaluatedAt = new Date(),
  transaction,
}) {
  const attempt = await transaction.examAttempt.findUnique({
    select: {
      answers: {
        select: {
          answerText: true,
          id: true,
          question: {
            select: {
              correctAnswerText: true,
              type: true,
            },
          },
          questionId: true,
          selectedOption: {
            select: { isCorrect: true, questionId: true },
          },
          selectedOptionId: true,
        },
      },
      exam: {
        select: {
          questions: {
            select: {
              marksOverride: true,
              question: { select: { marks: true } },
              questionId: true,
            },
          },
        },
      },
      id: true,
      status: true,
    },
    where: { id: attemptId },
  })

  if (!attempt) {
    throw attemptNotFoundError()
  }

  if (![AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED].includes(attempt.status)) {
    if (attempt.status === AttemptStatus.EVALUATED) {
      return {
        attempt: await transaction.examAttempt.findUniqueOrThrow({
          select: ATTEMPT_RESULT_SELECT,
          where: { id: attemptId },
        }),
        notificationAttemptId: null,
      }
    }

    throw new AppError('Only submitted attempts can be evaluated', 409, 'ATTEMPT_NOT_SUBMITTED')
  }

  const marksByQuestion = effectiveMarksByQuestion(attempt.exam)

  for (const answer of attempt.answers) {
    const maximumMarks = marksByQuestion.get(answer.questionId)

    if (maximumMarks === undefined) {
      throw new AppError(
        'An answer references a question outside the exam',
        500,
        'EVALUATION_DATA_INVALID',
      )
    }

    let grade

    if (CHOICE_TYPES.has(answer.question.type)) {
      const isCorrect =
        answer.selectedOptionId !== null &&
        answer.selectedOption?.questionId === answer.questionId &&
        answer.selectedOption.isCorrect

      grade = {
        isCorrect,
        marksAwarded: isCorrect ? maximumMarks : 0,
        needsManualReview: false,
      }
    } else if (answer.question.type === QuestionType.FILL_BLANK) {
      const isCorrect =
        normalizeAnswerText(answer.answerText) ===
        normalizeAnswerText(answer.question.correctAnswerText)

      grade = {
        isCorrect,
        marksAwarded: isCorrect ? maximumMarks : 0,
        needsManualReview: true,
      }
    } else if (MANUAL_TYPES.has(answer.question.type)) {
      grade = {
        isCorrect: null,
        marksAwarded: null,
        needsManualReview: true,
      }
    } else {
      throw new AppError('Unsupported question type', 500, 'EVALUATION_TYPE_UNSUPPORTED')
    }

    await transaction.studentAnswer.update({
      data: grade,
      where: { id: answer.id },
    })
  }

  const evaluation = await finalizeAttemptIfFullyGraded({
    attemptId,
    evaluatedAt,
    transaction,
  })
  const evaluatedAttempt = await transaction.examAttempt.findUniqueOrThrow({
    select: ATTEMPT_RESULT_SELECT,
    where: { id: attemptId },
  })

  return {
    attempt: evaluatedAttempt,
    notificationAttemptId: evaluation.transitionedToEvaluated ? attemptId : null,
  }
}

export async function gradeAttemptAnswer({ attemptId, marksAwarded, questionId, teacherId }) {
  try {
    const outcome = await runEvaluationTransaction(async (transaction) => {
      const attempt = await transaction.examAttempt.findUnique({
        select: {
          exam: {
            select: {
              createdById: true,
              id: true,
              questions: {
                select: {
                  marksOverride: true,
                  question: { select: { marks: true } },
                  questionId: true,
                },
              },
            },
          },
          id: true,
          status: true,
        },
        where: { id: attemptId },
      })

      if (!attempt) {
        throw attemptNotFoundError()
      }

      if (attempt.exam.createdById !== teacherId) {
        throw teacherForbiddenError()
      }

      if (!GRADABLE_ATTEMPT_STATUSES.includes(attempt.status)) {
        throw new AppError(
          'Answers can only be graded after submission',
          409,
          'ATTEMPT_NOT_SUBMITTED',
        )
      }

      const answer = await transaction.studentAnswer.findUnique({
        select: { id: true, needsManualReview: true },
        where: { attemptId_questionId: { attemptId, questionId } },
      })

      if (!answer) {
        throw new AppError('Answer not found on this attempt', 404, 'ANSWER_NOT_FOUND')
      }

      if (!answer.needsManualReview) {
        throw new AppError(
          'This answer is not pending manual review',
          409,
          'ANSWER_NOT_PENDING_REVIEW',
        )
      }

      const maximumMarks = effectiveMarksByQuestion(attempt.exam).get(questionId)

      if (maximumMarks === undefined) {
        throw new AppError('Question is not attached to this exam', 404, 'QUESTION_NOT_FOUND')
      }

      if (marksAwarded > maximumMarks) {
        throw new AppError(
          `marksAwarded must be between 0 and ${maximumMarks}`,
          400,
          'VALIDATION_ERROR',
          { field: 'marksAwarded', maximum: maximumMarks },
        )
      }

      const gradedAnswer = await transaction.studentAnswer.update({
        data: {
          isCorrect: marksAwarded === maximumMarks,
          marksAwarded,
          needsManualReview: false,
        },
        select: {
          answerText: true,
          isCorrect: true,
          marksAwarded: true,
          needsManualReview: true,
          questionId: true,
          selectedOptionId: true,
        },
        where: { id: answer.id },
      })
      const evaluation = await finalizeAttemptIfFullyGraded({
        attemptId,
        evaluatedAt: new Date(),
        transaction,
      })
      const updatedAttempt = await transaction.examAttempt.findUniqueOrThrow({
        select: ATTEMPT_RESULT_SELECT,
        where: { id: attemptId },
      })

      return {
        notificationAttemptId: evaluation.transitionedToEvaluated ? attemptId : null,
        result: {
          answer: gradedAnswer,
          attempt: updatedAttempt,
          finalized: evaluation.finalized,
        },
      }
    })

    if (outcome.notificationAttemptId) {
      await publishResultNotificationSafely(outcome.notificationAttemptId)
    }

    return outcome.result
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      throw new AppError(
        'The answer or attempt changed while it was being graded',
        409,
        'EVALUATION_STATE_CONFLICT',
      )
    }

    throw error
  }
}

export async function listPendingGrading({ examId, teacherId }) {
  const exam = await prisma.exam.findUnique({
    select: {
      createdById: true,
      id: true,
      questions: {
        select: {
          marksOverride: true,
          question: { select: { marks: true } },
          questionId: true,
        },
      },
      title: true,
    },
    where: { id: examId },
  })

  if (!exam) {
    throw examNotFoundError()
  }

  if (exam.createdById !== teacherId) {
    throw teacherForbiddenError()
  }

  const attempts = await prisma.examAttempt.findMany({
    orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
    select: {
      answers: {
        orderBy: { questionId: 'asc' },
        select: {
          answerText: true,
          isCorrect: true,
          marksAwarded: true,
          needsManualReview: true,
          question: {
            select: {
              correctAnswerText: true,
              text: true,
              type: true,
            },
          },
          questionId: true,
          selectedOption: { select: { id: true, text: true } },
        },
        where: { needsManualReview: true },
      },
      id: true,
      status: true,
      student: { select: { email: true, id: true, name: true } },
      submittedAt: true,
    },
    where: {
      answers: { some: { needsManualReview: true } },
      examId,
      status: { in: GRADABLE_ATTEMPT_STATUSES },
    },
  })
  const marksByQuestion = effectiveMarksByQuestion(exam)

  return {
    exam: { id: exam.id, title: exam.title },
    attempts: attempts.map((attempt) => ({
      answers: attempt.answers.map((answer) => ({
        answerText: answer.answerText,
        correctAnswerText: answer.question.correctAnswerText,
        isCorrect: answer.isCorrect,
        marksAwarded: answer.marksAwarded,
        maxMarks: marksByQuestion.get(answer.questionId),
        needsManualReview: answer.needsManualReview,
        questionId: answer.questionId,
        questionText: answer.question.text,
        questionType: answer.question.type,
        selectedOption: answer.selectedOption,
      })),
      id: attempt.id,
      status: attempt.status,
      student: attempt.student,
      submittedAt: attempt.submittedAt,
    })),
  }
}
