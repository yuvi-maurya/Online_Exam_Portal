import { AttemptStatus, ExamStatus, Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { publishResultNotificationSafely } from './notificationDeliveryService.js'
import {
  ATTEMPT_STATE_SELECT,
  attemptTimeExpiredError,
  autoFinalizeExpiredAttempt,
  buildAttemptPresentation,
  hasAttemptExpired,
  loadStudentAttemptView,
  runStudentAttemptTransaction,
  toStudentAttemptView,
  toStudentExamMetadata,
} from './studentAttemptSupport.js'

const TERMINAL_ATTEMPT_STATUSES = [
  AttemptStatus.SUBMITTED,
  AttemptStatus.AUTO_SUBMITTED,
  AttemptStatus.EVALUATED,
]

const STUDENT_EXAM_METADATA_SELECT = {
  durationMinutes: true,
  endTime: true,
  examType: true,
  fullScreenRequired: true,
  id: true,
  passingMarks: true,
  shuffleOptions: true,
  shuffleQuestions: true,
  startTime: true,
  status: true,
  subject: { select: { code: true, id: true, name: true } },
  tabSwitchLimit: true,
  title: true,
  totalMarks: true,
  webcamRequired: true,
}

const START_EXAM_SELECT = {
  ...STUDENT_EXAM_METADATA_SELECT,
  questions: {
    orderBy: { order: 'asc' },
    select: {
      question: {
        select: {
          options: {
            orderBy: { order: 'asc' },
            select: { id: true },
          },
        },
      },
      questionId: true,
    },
  },
}

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

function normalizeAttemptStatus(status) {
  if (!status) return 'NOT_STARTED'
  if (status === AttemptStatus.IN_PROGRESS) return 'IN_PROGRESS'
  if (status === AttemptStatus.EVALUATED) return 'EVALUATED'
  return 'SUBMITTED'
}

function toAttemptSummary(attempt) {
  if (!attempt) return null

  return {
    evaluatedAt: attempt.evaluatedAt,
    id: attempt.id,
    percentage: attempt.percentage,
    rank: attempt.rank,
    result: attempt.result,
    score: attempt.score,
    startedAt: attempt.startedAt,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    timeTakenSeconds: attempt.timeTakenSeconds,
  }
}

function examNotFoundError() {
  return new AppError('Exam not found', 404, 'EXAM_NOT_FOUND')
}

function examAlreadyAttemptedError() {
  return new AppError(
    'This exam has already been attempted and only one attempt is allowed',
    409,
    'EXAM_ALREADY_ATTEMPTED',
  )
}

function assertExamCanStart(exam, now) {
  if (exam.status !== ExamStatus.PUBLISHED) {
    throw new AppError('This exam is not available to start', 409, 'EXAM_NOT_AVAILABLE')
  }

  if ((exam.startTime && !exam.endTime) || (!exam.startTime && exam.endTime)) {
    throw new AppError('This exam has an invalid schedule', 409, 'EXAM_SCHEDULE_INVALID')
  }

  if (exam.startTime && now.getTime() < exam.startTime.getTime()) {
    throw new AppError('This exam has not started yet', 409, 'EXAM_NOT_STARTED')
  }

  if (exam.endTime && now.getTime() > exam.endTime.getTime()) {
    throw new AppError('This exam is no longer available', 409, 'EXAM_CLOSED')
  }
}

export async function listAvailableStudentExams(studentId) {
  const now = new Date()
  const exams = await prisma.exam.findMany({
    orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    select: {
      ...STUDENT_EXAM_METADATA_SELECT,
      _count: { select: { questions: true } },
      attempts: {
        select: {
          id: true,
          evaluatedAt: true,
          percentage: true,
          rank: true,
          result: true,
          score: true,
          startedAt: true,
          status: true,
          submittedAt: true,
          timeTakenSeconds: true,
        },
        take: 1,
        where: { studentId },
      },
    },
    where: {
      OR: [{ endTime: null, startTime: null }, { endTime: { gte: now } }],
      status: ExamStatus.PUBLISHED,
    },
  })

  return exams.map((exam) => {
    const [attempt] = exam.attempts

    return {
      ...toStudentExamMetadata(exam),
      attempt: toAttemptSummary(attempt),
      attemptStatus: normalizeAttemptStatus(attempt?.status),
      questionCount: exam._count.questions,
    }
  })
}

export async function listStudentExamHistory(studentId) {
  const attempts = await prisma.examAttempt.findMany({
    orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    select: {
      createdAt: true,
      evaluatedAt: true,
      exam: { select: STUDENT_EXAM_METADATA_SELECT },
      id: true,
      percentage: true,
      rank: true,
      result: true,
      score: true,
      startedAt: true,
      status: true,
      submittedAt: true,
      timeTakenSeconds: true,
    },
    where: {
      status: { in: TERMINAL_ATTEMPT_STATUSES },
      studentId,
    },
  })

  return attempts.map((attempt) => ({
    createdAt: attempt.createdAt,
    evaluatedAt: attempt.evaluatedAt,
    exam: toStudentExamMetadata(attempt.exam),
    id: attempt.id,
    percentage: attempt.percentage,
    rank: attempt.rank,
    result: attempt.result,
    score: attempt.score,
    startedAt: attempt.startedAt,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    timeTakenSeconds: attempt.timeTakenSeconds,
  }))
}

async function startStudentExamInternal({ examId, studentId }, retryUniqueConflict) {
  try {
    const outcome = await runStudentAttemptTransaction(async (transaction) => {
      const now = new Date()
      const exam = await transaction.exam.findUnique({
        select: START_EXAM_SELECT,
        where: { id: examId },
      })

      if (!exam) {
        throw examNotFoundError()
      }

      const existing = await transaction.examAttempt.findUnique({
        select: ATTEMPT_STATE_SELECT,
        where: { examId_studentId: { examId, studentId } },
      })

      if (existing) {
        if (existing.status !== AttemptStatus.IN_PROGRESS) {
          throw examAlreadyAttemptedError()
        }

        if (hasAttemptExpired(existing, now)) {
          const expiration = await autoFinalizeExpiredAttempt({
            attempt: existing,
            now,
            transaction,
          })
          return {
            kind: 'expired',
            notificationAttemptId: expiration.notificationAttemptId,
          }
        }
      }

      assertExamCanStart(exam, now)

      if (existing) {
        const attempt = await loadStudentAttemptView(existing.id, studentId, transaction)
        return { attempt: toStudentAttemptView(attempt), created: false, kind: 'active' }
      }

      if (exam.questions.length < 1) {
        throw new AppError('This exam has no questions', 409, 'EXAM_HAS_NO_QUESTIONS')
      }

      const created = await transaction.examAttempt.create({
        data: {
          examId,
          startedAt: now,
          status: AttemptStatus.IN_PROGRESS,
          studentId,
        },
        select: { id: true },
      })
      const presentation = buildAttemptPresentation({ attemptId: created.id, exam })

      await transaction.attemptQuestion.createMany({ data: presentation.attemptQuestions })

      if (presentation.attemptQuestionOptions.length > 0) {
        await transaction.attemptQuestionOption.createMany({
          data: presentation.attemptQuestionOptions,
        })
      }

      const attempt = await loadStudentAttemptView(created.id, studentId, transaction)
      return { attempt: toStudentAttemptView(attempt), created: true, kind: 'active' }
    })

    if (outcome.notificationAttemptId) {
      await publishResultNotificationSafely(outcome.notificationAttemptId)
    }

    if (outcome.kind === 'expired') {
      throw attemptTimeExpiredError()
    }

    return { attempt: outcome.attempt, created: outcome.created }
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      if (retryUniqueConflict) {
        return startStudentExamInternal({ examId, studentId }, false)
      }

      throw new AppError(
        'A concurrent request already started this exam. Please retry.',
        409,
        'ATTEMPT_START_CONFLICT',
      )
    }

    if (isPrismaError(error, 'P2003') || isPrismaError(error, 'P2025')) {
      throw new AppError(
        'The exam changed while the attempt was starting. Please retry.',
        409,
        'ATTEMPT_START_CONFLICT',
      )
    }

    throw error
  }
}

export function startStudentExam({ examId, studentId }) {
  return startStudentExamInternal({ examId, studentId }, true)
}
