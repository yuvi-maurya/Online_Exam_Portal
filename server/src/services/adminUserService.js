import { randomBytes } from 'node:crypto'
import { Prisma, Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { hashPassword } from '../utils/password.js'
import { AuditAction, AuditEntityType, recordAuditLog } from './auditLogService.js'
import { sendPasswordResetCode } from './authService.js'

const INTERACTIVE_TRANSACTION_TIMEOUT_MS = 15_000
const MANAGED_USER_SELECT = {
  createdAt: true,
  email: true,
  id: true,
  isActive: true,
  isEmailVerified: true,
  name: true,
  role: true,
  updatedAt: true,
}

const ROLE_METADATA = new Map([
  [Role.STUDENT, { errorCode: 'STUDENT_NOT_FOUND', label: 'Student' }],
  [Role.TEACHER, { errorCode: 'TEACHER_NOT_FOUND', label: 'Teacher' }],
])

function getRoleMetadata(role) {
  const metadata = ROLE_METADATA.get(role)

  if (!metadata) {
    throw new AppError('Unsupported managed user role', 500, 'INVALID_MANAGED_ROLE')
  }

  return metadata
}

function notFoundError(role) {
  const { errorCode, label } = getRoleMetadata(role)
  return new AppError(`${label} not found`, 404, errorCode)
}

function duplicateEmailError() {
  return new AppError('An account with this email already exists', 409, 'EMAIL_ALREADY_EXISTS')
}

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

function translateUserMutationError(error, role) {
  if (isPrismaError(error, 'P2002')) {
    throw duplicateEmailError()
  }

  if (isPrismaError(error, 'P2025')) {
    throw notFoundError(role)
  }

  throw error
}

export async function createManagedUser({ actorId, email, name, role }) {
  getRoleMetadata(role)

  const inaccessiblePassword = randomBytes(48).toString('base64url')
  const passwordHash = await hashPassword(inaccessiblePassword)
  let user

  try {
    user = await prisma.$transaction(
      async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            email,
            isActive: true,
            isEmailVerified: true,
            name,
            password: passwordHash,
            role,
          },
          select: MANAGED_USER_SELECT,
        })

        await recordAuditLog(
          {
            action: AuditAction.USER_CREATED,
            actorId,
            entityId: createdUser.id,
            entityType: AuditEntityType.USER,
            metadata: { role },
          },
          transaction,
        )

        return createdUser
      },
      { timeout: INTERACTIVE_TRANSACTION_TIMEOUT_MS },
    )
  } catch (error) {
    translateUserMutationError(error, role)
  }

  await sendPasswordResetCode(user)
  return user
}

export async function listManagedUsers({ limit, page, role, search }) {
  getRoleMetadata(role)

  const where = {
    role,
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }
  const skip = (page - 1) * limit

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      select: MANAGED_USER_SELECT,
      skip,
      take: limit,
      where,
    }),
    prisma.user.count({ where }),
  ])

  return {
    pagination: {
      limit,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    },
    users,
  }
}

export async function getManagedUser({ id, role }) {
  getRoleMetadata(role)

  const user = await prisma.user.findFirst({
    select: MANAGED_USER_SELECT,
    where: { id, role },
  })

  if (!user) {
    throw notFoundError(role)
  }

  return user
}

export async function updateManagedUser({ changes, id, role }) {
  getRoleMetadata(role)

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const user = await transaction.user.update({
          data: changes,
          select: MANAGED_USER_SELECT,
          where: { id, role },
        })

        if (changes.email) {
          await transaction.verificationToken.deleteMany({ where: { userId: id } })
        }

        return user
      },
      { timeout: INTERACTIVE_TRANSACTION_TIMEOUT_MS },
    )
  } catch (error) {
    translateUserMutationError(error, role)
  }
}

export async function setManagedUserActive({ actorId, id, isActive, role }) {
  getRoleMetadata(role)

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const user = await transaction.user.update({
          data: { isActive },
          select: MANAGED_USER_SELECT,
          where: { id, role },
        })

        await recordAuditLog(
          {
            action: isActive ? AuditAction.USER_REACTIVATED : AuditAction.USER_DEACTIVATED,
            actorId,
            entityId: user.id,
            entityType: AuditEntityType.USER,
            metadata: { role },
          },
          transaction,
        )

        return user
      },
      { timeout: INTERACTIVE_TRANSACTION_TIMEOUT_MS },
    )
  } catch (error) {
    translateUserMutationError(error, role)
  }
}
