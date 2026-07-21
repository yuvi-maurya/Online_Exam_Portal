import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

const SUBJECT_SELECT = {
  code: true,
  createdAt: true,
  createdById: true,
  description: true,
  id: true,
  name: true,
}

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

function subjectNotFoundError() {
  return new AppError('Subject not found', 404, 'SUBJECT_NOT_FOUND')
}

function duplicateSubjectCodeError() {
  return new AppError('A subject with this code already exists', 409, 'SUBJECT_CODE_ALREADY_EXISTS')
}

function subjectDependencyError() {
  return new AppError(
    'Subject cannot be deleted because it has associated questions or exams',
    409,
    'SUBJECT_HAS_DEPENDENCIES',
  )
}

export async function createSubject({ createdById, subject }) {
  try {
    return await prisma.subject.create({
      data: {
        code: subject.code,
        createdById,
        description: subject.description,
        name: subject.name,
      },
      select: SUBJECT_SELECT,
    })
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      throw duplicateSubjectCodeError()
    }

    if (isPrismaError(error, 'P2003')) {
      throw new AppError('The authenticated administrator no longer exists', 401, 'INVALID_TOKEN')
    }

    throw error
  }
}

export function listSubjects() {
  return prisma.subject.findMany({
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    select: SUBJECT_SELECT,
  })
}

export async function getSubject(id) {
  const subject = await prisma.subject.findUnique({
    select: SUBJECT_SELECT,
    where: { id },
  })

  if (!subject) {
    throw subjectNotFoundError()
  }

  return subject
}

export async function updateSubject(id, changes) {
  try {
    return await prisma.subject.update({
      data: changes,
      select: SUBJECT_SELECT,
      where: { id },
    })
  } catch (error) {
    if (isPrismaError(error, 'P2002')) {
      throw duplicateSubjectCodeError()
    }

    if (isPrismaError(error, 'P2025')) {
      throw subjectNotFoundError()
    }

    throw error
  }
}

export async function deleteSubject(id) {
  const subject = await prisma.subject.findUnique({
    select: {
      _count: { select: { exams: true, questions: true } },
      ...SUBJECT_SELECT,
    },
    where: { id },
  })

  if (!subject) {
    throw subjectNotFoundError()
  }

  if (subject._count.exams > 0 || subject._count.questions > 0) {
    throw subjectDependencyError()
  }

  try {
    await prisma.subject.delete({ where: { id } })
  } catch (error) {
    if (isPrismaError(error, 'P2003')) {
      throw subjectDependencyError()
    }

    if (isPrismaError(error, 'P2025')) {
      throw subjectNotFoundError()
    }

    throw error
  }

  return {
    code: subject.code,
    createdAt: subject.createdAt,
    createdById: subject.createdById,
    description: subject.description,
    id: subject.id,
    name: subject.name,
  }
}
