import { ExamStatus, Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { recomputeExamTotalMarks } from '../utils/examTotals.js'
import { runSerializableTransaction } from '../utils/prismaTransactions.js'
import { validateCompleteQuestionDefinition } from '../utils/teacherValidation.js'

const QUESTION_INCLUDE = {
  options: {
    orderBy: { order: 'asc' },
    select: { id: true, isCorrect: true, order: true, text: true },
  },
}

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

function questionNotFoundError() {
  return new AppError('Question not found', 404, 'QUESTION_NOT_FOUND')
}

function forbiddenError() {
  return new AppError('You can only manage questions you created', 403, 'FORBIDDEN')
}

function questionDependencyError() {
  return new AppError(
    'Question cannot be deleted because it is attached to an exam or has student responses',
    409,
    'QUESTION_HAS_DEPENDENCIES',
  )
}

function subjectNotFoundError() {
  return new AppError('Subject not found', 404, 'SUBJECT_NOT_FOUND')
}

function runQuestionTransaction(operation) {
  return runSerializableTransaction(operation, {
    conflictCode: 'QUESTION_TRANSACTION_CONFLICT',
    conflictMessage: 'The question changed concurrently. Please retry.',
    timeoutCode: 'QUESTION_TRANSACTION_TIMEOUT',
    timeoutMessage: 'The question update could not complete in time. Please retry.',
  })
}

function toQuestionResponse(question) {
  return {
    content: question.text,
    correctAnswerText: question.correctAnswerText,
    createdAt: question.createdAt,
    createdById: question.createdById,
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

async function assertSubjectExists(subjectId, client = prisma) {
  const subject = await client.subject.findUnique({
    select: { id: true },
    where: { id: subjectId },
  })

  if (!subject) {
    throw subjectNotFoundError()
  }
}

async function findOwnedQuestion(id, teacherId, client = prisma, extra = {}) {
  const question = await client.question.findUnique({
    ...extra,
    where: { id },
  })

  if (!question) {
    throw questionNotFoundError()
  }

  if (question.createdById !== teacherId) {
    throw forbiddenError()
  }

  return question
}

export async function createTeacherQuestion({ question, teacherId }) {
  await assertSubjectExists(question.subjectId)

  try {
    const created = await prisma.question.create({
      data: {
        correctAnswerText: question.correctAnswerText,
        createdById: teacherId,
        difficulty: question.difficulty,
        marks: question.marks,
        options: {
          create: question.options.map((option) => ({
            isCorrect: option.isCorrect,
            order: option.order,
            text: option.text,
          })),
        },
        subjectId: question.subjectId,
        text: question.content,
        type: question.type,
      },
      include: QUESTION_INCLUDE,
    })

    return toQuestionResponse(created)
  } catch (error) {
    if (isPrismaError(error, 'P2003')) {
      throw subjectNotFoundError()
    }

    if (isPrismaError(error, 'P2002')) {
      throw new AppError('Option orders must be unique', 409, 'QUESTION_OPTION_ORDER_CONFLICT')
    }

    throw error
  }
}

export async function listTeacherQuestions({ filters, teacherId }) {
  const { difficulty, limit, page, subjectId, type } = filters
  const where = {
    createdById: teacherId,
    ...(difficulty ? { difficulty } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(type ? { type } : {}),
  }

  const [questions, total] = await prisma.$transaction([
    prisma.question.findMany({
      include: QUESTION_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      where,
    }),
    prisma.question.count({ where }),
  ])

  return {
    pagination: { limit, page, total, totalPages: Math.ceil(total / limit) },
    questions: questions.map(toQuestionResponse),
  }
}

export async function getTeacherQuestion({ id, teacherId }) {
  const question = await findOwnedQuestion(id, teacherId, prisma, { include: QUESTION_INCLUDE })
  return toQuestionResponse(question)
}

export async function updateTeacherQuestion({ changes, id, teacherId }) {
  try {
    const updated = await runQuestionTransaction(async (transaction) => {
      const existing = await findOwnedQuestion(id, teacherId, transaction, {
        include: {
          ...QUESTION_INCLUDE,
          exams: {
            select: {
              exam: { select: { status: true } },
              examId: true,
              marksOverride: true,
            },
          },
          studentAnswers: { select: { id: true }, take: 1 },
        },
      })

      if (existing.exams.some(({ exam }) => exam.status !== ExamStatus.DRAFT)) {
        throw new AppError(
          'Question cannot be changed while it belongs to a non-draft exam',
          409,
          'QUESTION_LOCKED',
        )
      }

      const definition = validateCompleteQuestionDefinition({
        content: changes.content ?? existing.text,
        correctAnswerText: Object.hasOwn(changes, 'correctAnswerText')
          ? changes.correctAnswerText
          : existing.correctAnswerText,
        difficulty: changes.difficulty ?? existing.difficulty,
        marks: changes.marks ?? existing.marks,
        options: Object.hasOwn(changes, 'options')
          ? changes.options
          : existing.options.map((option) => ({
              isCorrect: option.isCorrect,
              order: option.order,
              text: option.text,
            })),
        subjectId: changes.subjectId ?? existing.subjectId,
        type: changes.type ?? existing.type,
      })

      if (definition.subjectId !== existing.subjectId) {
        if (existing.exams.length > 0) {
          throw new AppError(
            'Question subject cannot change while it is attached to an exam',
            409,
            'QUESTION_HAS_DEPENDENCIES',
          )
        }

        await assertSubjectExists(definition.subjectId, transaction)
      }

      const replaceOptions = Object.hasOwn(changes, 'options') || changes.type !== undefined

      if (replaceOptions && existing.studentAnswers.length > 0) {
        throw new AppError(
          'Question options cannot change after students have answered the question',
          409,
          'QUESTION_HAS_DEPENDENCIES',
        )
      }

      if (replaceOptions) {
        await transaction.questionOption.deleteMany({ where: { questionId: id } })

        if (definition.options.length > 0) {
          await transaction.questionOption.createMany({
            data: definition.options.map((option) => ({
              isCorrect: option.isCorrect,
              order: option.order,
              questionId: id,
              text: option.text,
            })),
          })
        }
      }

      await transaction.question.update({
        data: {
          correctAnswerText: definition.correctAnswerText,
          difficulty: definition.difficulty,
          marks: definition.marks,
          subjectId: definition.subjectId,
          text: definition.content,
          type: definition.type,
        },
        where: { createdById: teacherId, id },
      })

      if (definition.marks !== existing.marks) {
        const affectedExamIds = new Set(
          existing.exams
            .filter(
              (attachment) =>
                attachment.exam.status === ExamStatus.DRAFT && attachment.marksOverride === null,
            )
            .map((attachment) => attachment.examId),
        )

        for (const examId of affectedExamIds) {
          await recomputeExamTotalMarks(examId, transaction)
        }
      }

      return transaction.question.findUniqueOrThrow({
        include: QUESTION_INCLUDE,
        where: { id },
      })
    })

    return toQuestionResponse(updated)
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      throw new AppError('Option orders must be unique', 409, 'QUESTION_OPTION_ORDER_CONFLICT')
    }

    if (isPrismaError(error, 'P2003')) {
      throw new AppError(
        'Question cannot be changed because related records depend on it',
        409,
        'QUESTION_HAS_DEPENDENCIES',
      )
    }

    if (isPrismaError(error, 'P2025')) {
      throw questionNotFoundError()
    }

    throw error
  }
}

export async function deleteTeacherQuestion({ id, teacherId }) {
  const question = await findOwnedQuestion(id, teacherId, prisma, {
    include: {
      ...QUESTION_INCLUDE,
      _count: { select: { exams: true, studentAnswers: true } },
    },
  })

  if (question._count.exams > 0 || question._count.studentAnswers > 0) {
    throw questionDependencyError()
  }

  try {
    await prisma.question.delete({ where: { createdById: teacherId, id } })
  } catch (error) {
    if (isPrismaError(error, 'P2003')) {
      throw questionDependencyError()
    }

    if (isPrismaError(error, 'P2025')) {
      throw questionNotFoundError()
    }

    throw error
  }

  return toQuestionResponse(question)
}
