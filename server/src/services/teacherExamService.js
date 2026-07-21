import { ExamStatus, Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { recomputeExamTotalMarks } from '../utils/examTotals.js'
import { runSerializableTransaction } from '../utils/prismaTransactions.js'

const EXAM_DETAIL_INCLUDE = {
  _count: { select: { attempts: true, questions: true } },
  questions: {
    orderBy: { order: 'asc' },
    select: {
      id: true,
      marksOverride: true,
      order: true,
      question: {
        select: {
          correctAnswerText: true,
          difficulty: true,
          id: true,
          marks: true,
          options: {
            orderBy: { order: 'asc' },
            select: { id: true, isCorrect: true, order: true, text: true },
          },
          subjectId: true,
          text: true,
          type: true,
        },
      },
      questionId: true,
    },
  },
}

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

function examNotFoundError() {
  return new AppError('Exam not found', 404, 'EXAM_NOT_FOUND')
}

function examForbiddenError() {
  return new AppError('You can only manage exams you created', 403, 'FORBIDDEN')
}

function examNotDraftError() {
  return new AppError('Only draft exams can be changed', 409, 'EXAM_NOT_DRAFT')
}

function subjectNotFoundError() {
  return new AppError('Subject not found', 404, 'SUBJECT_NOT_FOUND')
}

function examQuestionNotFoundError() {
  return new AppError('The question is not attached to this exam', 404, 'EXAM_QUESTION_NOT_FOUND')
}

function toQuestionSummary(question) {
  return {
    content: question.text,
    correctAnswerText: question.correctAnswerText,
    difficulty: question.difficulty,
    id: question.id,
    marks: question.marks,
    options: question.options.map((option) => ({
      id: option.id,
      isCorrect: option.isCorrect,
      order: option.order,
      text: option.text,
    })),
    subjectId: question.subjectId,
    type: question.type,
  }
}

function toExamResponse(exam) {
  const response = {
    createdAt: exam.createdAt,
    createdById: exam.createdById,
    durationMinutes: exam.durationMinutes,
    fullScreenRequired: exam.fullScreenRequired,
    id: exam.id,
    passingMarks: exam.passingMarks,
    scheduledEnd: exam.endTime,
    scheduledStart: exam.startTime,
    shuffleOptions: exam.shuffleOptions,
    shuffleQuestions: exam.shuffleQuestions,
    status: exam.status,
    subjectId: exam.subjectId,
    tabSwitchLimit: exam.tabSwitchLimit,
    title: exam.title,
    totalMarks: exam.totalMarks,
    type: exam.examType,
    webcamMonitoring: exam.webcamRequired,
  }

  if (exam._count) {
    response.attemptCount = exam._count.attempts
    response.questionCount = exam._count.questions
  }

  if (exam.questions) {
    response.questions = exam.questions.map((attachment) => ({
      id: attachment.id,
      marks: attachment.marksOverride ?? attachment.question.marks,
      order: attachment.order,
      question: toQuestionSummary(attachment.question),
      questionId: attachment.questionId,
    }))
  }

  return response
}

function runExamTransaction(operation) {
  return runSerializableTransaction(operation, {
    conflictCode: 'EXAM_TRANSACTION_CONFLICT',
    conflictMessage: 'The exam changed concurrently. Please retry.',
    timeoutCode: 'EXAM_TRANSACTION_TIMEOUT',
    timeoutMessage: 'The exam update could not complete in time. Please retry.',
  })
}

async function assertSubjectExists(subjectId, client = prisma) {
  const subject = await client.subject.findUnique({
    select: { id: true },
    where: { id: subjectId },
  })

  if (!subject) {
    throw subjectNotFoundError()
  }
}

async function findOwnedExam(id, teacherId, client = prisma, extra = {}) {
  const exam = await client.exam.findUnique({ ...extra, where: { id } })

  if (!exam) {
    throw examNotFoundError()
  }

  if (exam.createdById !== teacherId) {
    throw examForbiddenError()
  }

  return exam
}

function assertDraft(exam) {
  if (exam.status !== ExamStatus.DRAFT) {
    throw examNotDraftError()
  }
}

function mapExamChanges(changes) {
  return {
    ...(changes.durationMinutes !== undefined ? { durationMinutes: changes.durationMinutes } : {}),
    ...(changes.fullScreenRequired !== undefined
      ? { fullScreenRequired: changes.fullScreenRequired }
      : {}),
    ...(changes.passingMarks !== undefined ? { passingMarks: changes.passingMarks } : {}),
    ...(changes.shuffleOptions !== undefined ? { shuffleOptions: changes.shuffleOptions } : {}),
    ...(changes.shuffleQuestions !== undefined
      ? { shuffleQuestions: changes.shuffleQuestions }
      : {}),
    ...(changes.subjectId !== undefined ? { subjectId: changes.subjectId } : {}),
    ...(changes.tabSwitchLimit !== undefined ? { tabSwitchLimit: changes.tabSwitchLimit } : {}),
    ...(changes.title !== undefined ? { title: changes.title } : {}),
    ...(changes.type !== undefined ? { examType: changes.type } : {}),
    ...(changes.webcamMonitoring !== undefined ? { webcamRequired: changes.webcamMonitoring } : {}),
  }
}

function translateAttachmentMutationError(error) {
  if (isPrismaError(error, 'P2002')) {
    throw new AppError(
      'A question or order is already used in this exam',
      409,
      'EXAM_QUESTION_CONFLICT',
    )
  }

  if (isPrismaError(error, 'P2003')) {
    throw new AppError('A referenced question no longer exists', 404, 'QUESTION_NOT_FOUND')
  }

  if (isPrismaError(error, 'P2025')) {
    throw examNotFoundError()
  }

  throw error
}

export async function createTeacherExam({ exam, teacherId }) {
  await assertSubjectExists(exam.subjectId)

  try {
    const created = await prisma.exam.create({
      data: {
        createdById: teacherId,
        durationMinutes: exam.durationMinutes,
        endTime: null,
        examType: exam.type,
        fullScreenRequired: exam.fullScreenRequired,
        passingMarks: exam.passingMarks,
        shuffleOptions: exam.shuffleOptions,
        shuffleQuestions: exam.shuffleQuestions,
        startTime: null,
        status: ExamStatus.DRAFT,
        subjectId: exam.subjectId,
        tabSwitchLimit: exam.tabSwitchLimit,
        title: exam.title,
        totalMarks: 0,
        webcamRequired: exam.webcamMonitoring,
      },
    })

    return toExamResponse(created)
  } catch (error) {
    if (isPrismaError(error, 'P2003')) {
      throw subjectNotFoundError()
    }

    throw error
  }
}

export async function listTeacherExams(teacherId) {
  const exams = await prisma.exam.findMany({
    include: { _count: { select: { attempts: true, questions: true } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    where: { createdById: teacherId },
  })

  return exams.map(toExamResponse)
}

export async function getTeacherExam({ id, teacherId }) {
  const exam = await findOwnedExam(id, teacherId, prisma, { include: EXAM_DETAIL_INCLUDE })
  return toExamResponse(exam)
}

export async function updateTeacherExam({ changes, id, teacherId }) {
  try {
    const exam = await runExamTransaction(async (transaction) => {
      const existing = await findOwnedExam(id, teacherId, transaction, {
        include: { _count: { select: { questions: true } } },
      })
      assertDraft(existing)

      if (changes.subjectId && changes.subjectId !== existing.subjectId) {
        if (existing._count.questions > 0) {
          throw new AppError(
            'Exam subject cannot change after questions are attached',
            409,
            'EXAM_HAS_QUESTIONS',
          )
        }

        await assertSubjectExists(changes.subjectId, transaction)
      }

      return transaction.exam.update({
        data: mapExamChanges(changes),
        where: { createdById: teacherId, id, status: ExamStatus.DRAFT },
      })
    })

    return toExamResponse(exam)
  } catch (error) {
    if (isPrismaError(error, 'P2003')) {
      throw subjectNotFoundError()
    }

    if (isPrismaError(error, 'P2025')) {
      throw examNotDraftError()
    }

    throw error
  }
}

export async function attachQuestionsToExam({ attachments, id, teacherId }) {
  try {
    const exam = await runExamTransaction(async (transaction) => {
      const existing = await findOwnedExam(id, teacherId, transaction)
      assertDraft(existing)

      const questionIds = attachments.map((attachment) => attachment.questionId)
      const questions = await transaction.question.findMany({
        select: { createdById: true, id: true, subjectId: true },
        where: { id: { in: questionIds } },
      })

      if (questions.length !== questionIds.length) {
        throw new AppError('One or more questions do not exist', 404, 'QUESTION_NOT_FOUND')
      }

      if (questions.some((question) => question.createdById !== teacherId)) {
        throw new AppError('You can only attach questions you created', 403, 'FORBIDDEN')
      }

      if (questions.some((question) => question.subjectId !== existing.subjectId)) {
        throw new AppError(
          'Every attached question must belong to the exam subject',
          400,
          'QUESTION_SUBJECT_MISMATCH',
        )
      }

      await transaction.examQuestion.createMany({
        data: attachments.map((attachment) => ({
          examId: id,
          marksOverride: attachment.marks,
          order: attachment.order,
          questionId: attachment.questionId,
        })),
      })

      await recomputeExamTotalMarks(id, transaction)
      return transaction.exam.findUniqueOrThrow({ include: EXAM_DETAIL_INCLUDE, where: { id } })
    })

    return toExamResponse(exam)
  } catch (error) {
    translateAttachmentMutationError(error)
  }
}

export async function updateExamQuestion({ changes, examId, questionId, teacherId }) {
  try {
    const exam = await runExamTransaction(async (transaction) => {
      const existing = await findOwnedExam(examId, teacherId, transaction)
      assertDraft(existing)

      const attachment = await transaction.examQuestion.findUnique({
        where: { examId_questionId: { examId, questionId } },
      })

      if (!attachment) {
        throw examQuestionNotFoundError()
      }

      await transaction.examQuestion.update({
        data: {
          ...(changes.marks !== undefined ? { marksOverride: changes.marks } : {}),
          ...(changes.order !== undefined ? { order: changes.order } : {}),
        },
        where: { examId_questionId: { examId, questionId } },
      })

      await recomputeExamTotalMarks(examId, transaction)
      return transaction.exam.findUniqueOrThrow({
        include: EXAM_DETAIL_INCLUDE,
        where: { id: examId },
      })
    })

    return toExamResponse(exam)
  } catch (error) {
    translateAttachmentMutationError(error)
  }
}

export async function detachQuestionFromExam({ examId, questionId, teacherId }) {
  try {
    const exam = await runExamTransaction(async (transaction) => {
      const existing = await findOwnedExam(examId, teacherId, transaction)
      assertDraft(existing)

      const attachment = await transaction.examQuestion.findUnique({
        select: { id: true },
        where: { examId_questionId: { examId, questionId } },
      })

      if (!attachment) {
        throw examQuestionNotFoundError()
      }

      await transaction.examQuestion.delete({
        where: { examId_questionId: { examId, questionId } },
      })
      await recomputeExamTotalMarks(examId, transaction)

      return transaction.exam.findUniqueOrThrow({
        include: EXAM_DETAIL_INCLUDE,
        where: { id: examId },
      })
    })

    return toExamResponse(exam)
  } catch (error) {
    translateAttachmentMutationError(error)
  }
}

export async function scheduleTeacherExam({ id, schedule, teacherId }) {
  try {
    const exam = await runExamTransaction(async (transaction) => {
      const existing = await findOwnedExam(id, teacherId, transaction)
      assertDraft(existing)

      return transaction.exam.update({
        data: { endTime: schedule.scheduledEnd, startTime: schedule.scheduledStart },
        where: { createdById: teacherId, id, status: ExamStatus.DRAFT },
      })
    })

    return toExamResponse(exam)
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      throw examNotDraftError()
    }

    throw error
  }
}

export async function publishTeacherExam({ id, teacherId }) {
  try {
    const exam = await runExamTransaction(async (transaction) => {
      const existing = await findOwnedExam(id, teacherId, transaction)
      assertDraft(existing)

      const { questionCount, totalMarks } = await recomputeExamTotalMarks(id, transaction)
      const issues = []

      if (questionCount < 1) issues.push('At least one question must be attached.')
      if (totalMarks <= 0) issues.push('Total marks must be greater than zero.')
      if (existing.passingMarks > totalMarks) {
        issues.push('Passing marks must not exceed total marks.')
      }
      if (!existing.startTime || !existing.endTime) {
        issues.push('A schedule with both start and end times is required.')
      } else {
        if (existing.endTime <= existing.startTime) {
          issues.push('Scheduled end must be after scheduled start.')
        }
        if (existing.startTime <= new Date()) {
          issues.push('Scheduled start must still be in the future.')
        }
      }

      if (issues.length > 0) {
        throw new AppError(
          `Exam cannot be published: ${issues.join(' ')}`,
          400,
          'EXAM_NOT_READY_FOR_PUBLICATION',
          { requirements: issues },
        )
      }

      await transaction.exam.update({
        data: { status: ExamStatus.PUBLISHED, totalMarks },
        where: { createdById: teacherId, id, status: ExamStatus.DRAFT },
      })

      return transaction.exam.findUniqueOrThrow({ include: EXAM_DETAIL_INCLUDE, where: { id } })
    })

    return toExamResponse(exam)
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      throw new AppError('Exam status changed; refresh and try again', 409, 'EXAM_STATUS_CONFLICT')
    }

    throw error
  }
}

export async function deleteTeacherExam({ id, teacherId }) {
  const exam = await findOwnedExam(id, teacherId, prisma, { include: EXAM_DETAIL_INCLUDE })

  if (exam.status !== ExamStatus.DRAFT || exam._count.attempts > 0) {
    throw new AppError(
      'Only draft exams without attempts can be deleted. Archive the exam instead.',
      409,
      'EXAM_DELETE_NOT_ALLOWED',
    )
  }

  try {
    await prisma.exam.delete({
      where: { createdById: teacherId, id, status: ExamStatus.DRAFT },
    })
  } catch (error) {
    if (isPrismaError(error, 'P2003')) {
      throw new AppError(
        'Exam has historical records and cannot be deleted. Archive it instead.',
        409,
        'EXAM_DELETE_NOT_ALLOWED',
      )
    }

    if (isPrismaError(error, 'P2025')) {
      throw new AppError(
        'Exam state changed and it can no longer be deleted. Archive it instead.',
        409,
        'EXAM_DELETE_NOT_ALLOWED',
      )
    }

    throw error
  }

  return toExamResponse(exam)
}

export async function archiveTeacherExam({ id, teacherId }) {
  try {
    const exam = await runExamTransaction(async (transaction) => {
      const existing = await findOwnedExam(id, teacherId, transaction)

      if (existing.status !== ExamStatus.PUBLISHED) {
        throw new AppError(
          'Only published exams can be archived; delete an unused draft instead.',
          409,
          'EXAM_ARCHIVE_NOT_ALLOWED',
        )
      }

      await transaction.exam.update({
        data: { status: ExamStatus.ARCHIVED },
        where: { createdById: teacherId, id, status: ExamStatus.PUBLISHED },
      })

      return transaction.exam.findUniqueOrThrow({ include: EXAM_DETAIL_INCLUDE, where: { id } })
    })

    return toExamResponse(exam)
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      throw new AppError('Exam status changed; refresh and try again', 409, 'EXAM_STATUS_CONFLICT')
    }

    throw error
  }
}
