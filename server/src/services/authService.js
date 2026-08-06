import { Prisma, Role, VerificationPurpose } from '@prisma/client'
import { logger } from '../config/logger.js'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { signAuthToken } from '../utils/jwt.js'
import { createOtpDigest, generateOtp, getOtpExpiration, verifyOtpDigest } from '../utils/otp.js'
import { comparePassword, hashPassword } from '../utils/password.js'
import { sendEmailVerificationOtp, sendPasswordResetOtp } from './emailService.js'

const PUBLIC_USER_SELECT = {
  email: true,
  id: true,
  isEmailVerified: true,
  name: true,
  role: true,
}

const GENERIC_PASSWORD_RESET_MESSAGE =
  'If an account exists for that email, a password reset code has been sent.'
const INTERACTIVE_TRANSACTION_TIMEOUT_MS = 15_000
const SERIALIZABLE_TRANSACTION_RETRIES = 3

function invalidOtpError() {
  return new AppError('The verification code is invalid or expired', 400, 'INVALID_OR_EXPIRED_OTP')
}

function isUniqueConstraintError(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function isTransactionConflict(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034'
}

async function runSerializableTransaction(operation) {
  for (let attempt = 1; attempt <= SERIALIZABLE_TRANSACTION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: INTERACTIVE_TRANSACTION_TIMEOUT_MS,
      })
    } catch (error) {
      if (!isTransactionConflict(error)) {
        throw error
      }

      if (attempt === SERIALIZABLE_TRANSACTION_RETRIES) {
        throw new AppError(
          'Unable to complete verification request',
          503,
          'TRANSACTION_RETRY_EXHAUSTED',
        )
      }
    }
  }

  throw new AppError('Unable to complete verification request', 503, 'TRANSACTION_RETRY_EXHAUSTED')
}

async function issueOtp(userId, purpose) {
  const code = generateOtp()
  const codeDigest = createOtpDigest({ otp: code, purpose, userId })
  const expiresAt = getOtpExpiration()

  await runSerializableTransaction(async (transaction) => {
    await transaction.verificationToken.deleteMany({ where: { purpose, userId } })
    await transaction.verificationToken.create({
      data: { code: codeDigest, expiresAt, purpose, userId },
    })
  })

  return { code, expiresAt }
}

async function consumeOtp({ code, purpose, userId }, transaction) {
  const now = new Date()
  const token = await transaction.verificationToken.findFirst({
    orderBy: { createdAt: 'desc' },
    where: {
      expiresAt: { gt: now },
      purpose,
      userId,
    },
  })

  if (!token || !verifyOtpDigest({ digest: token.code, otp: code, purpose, userId })) {
    throw invalidOtpError()
  }

  const consumed = await transaction.verificationToken.deleteMany({
    where: {
      expiresAt: { gt: now },
      id: token.id,
    },
  })

  if (consumed.count !== 1) {
    throw invalidOtpError()
  }
}

export async function registerStudent({ email, name, password }) {
  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409, 'EMAIL_ALREADY_EXISTS')
  }

  const passwordHash = await hashPassword(password)
  const code = generateOtp()
  const expiresAt = getOtpExpiration()
  let user

  try {
    user = await prisma.$transaction(
      async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            email,
            isEmailVerified: false,
            name,
            password: passwordHash,
            role: Role.STUDENT,
          },
          select: PUBLIC_USER_SELECT,
        })

        await transaction.verificationToken.create({
          data: {
            code: createOtpDigest({
              otp: code,
              purpose: VerificationPurpose.EMAIL_VERIFICATION,
              userId: createdUser.id,
            }),
            expiresAt,
            purpose: VerificationPurpose.EMAIL_VERIFICATION,
            userId: createdUser.id,
          },
        })

        return createdUser
      },
      { timeout: INTERACTIVE_TRANSACTION_TIMEOUT_MS },
    )
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_ALREADY_EXISTS')
    }

    throw error
  }

  await sendEmailVerificationOtp({ name: user.name, otp: code, to: user.email })
  return user
}

export async function verifyEmailAddress({ email, otp }) {
  const user = await prisma.user.findUnique({
    select: PUBLIC_USER_SELECT,
    where: { email },
  })

  if (!user) {
    throw invalidOtpError()
  }

  if (user.isEmailVerified) {
    await prisma.verificationToken.deleteMany({
      where: { purpose: VerificationPurpose.EMAIL_VERIFICATION, userId: user.id },
    })
    throw invalidOtpError()
  }

  return prisma.$transaction(
    async (transaction) => {
      await consumeOtp(
        {
          code: otp,
          purpose: VerificationPurpose.EMAIL_VERIFICATION,
          userId: user.id,
        },
        transaction,
      )

      const verifiedUser = await transaction.user.update({
        data: { isEmailVerified: true },
        select: PUBLIC_USER_SELECT,
        where: { id: user.id },
      })

      await transaction.verificationToken.deleteMany({
        where: { purpose: VerificationPurpose.EMAIL_VERIFICATION, userId: user.id },
      })

      return verifiedUser
    },
    { timeout: INTERACTIVE_TRANSACTION_TIMEOUT_MS },
  )
}

export async function resendEmailVerificationOtp({ email }) {
  const user = await prisma.user.findUnique({
    select: { email: true, id: true, isEmailVerified: true, name: true },
    where: { email },
  })

  if (!user || user.isEmailVerified) {
    return
  }

  const { code } = await issueOtp(user.id, VerificationPurpose.EMAIL_VERIFICATION)
  await sendEmailVerificationOtp({ name: user.name, otp: code, to: user.email })
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    await hashPassword(password)
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  const passwordMatches = await comparePassword(password, user.password)

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  if (!user.isActive) {
    throw new AppError(
      'This account has been deactivated. Contact an administrator.',
      403,
      'ACCOUNT_INACTIVE',
    )
  }

  if (!user.isEmailVerified) {
    throw new AppError('Email verification is required before login', 403, 'EMAIL_NOT_VERIFIED')
  }

  const publicUser = {
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role,
  }

  return {
    token: signAuthToken({ role: user.role, userId: user.id }),
    user: publicUser,
  }
}

export async function sendPasswordResetCode(user) {
  const { code } = await issueOtp(user.id, VerificationPurpose.PASSWORD_RESET)
  await sendPasswordResetOtp({ name: user.name, otp: code, to: user.email })
}

export async function requestPasswordReset({ email }) {
  const user = await prisma.user.findUnique({
    select: { email: true, id: true, name: true },
    where: { email },
  })

  if (!user) {
    return GENERIC_PASSWORD_RESET_MESSAGE
  }

  try {
    await sendPasswordResetCode(user)
  } catch {
    logger.error({ event: 'password_reset_email_delivery_failed' }, 'Email delivery failed')
  }

  return GENERIC_PASSWORD_RESET_MESSAGE
}

export async function resetUserPassword({ email, newPassword, otp }) {
  const passwordHash = await hashPassword(newPassword)
  const user = await prisma.user.findUnique({
    select: { id: true },
    where: { email },
  })

  if (!user) {
    throw invalidOtpError()
  }

  await prisma.$transaction(
    async (transaction) => {
      await consumeOtp(
        {
          code: otp,
          purpose: VerificationPurpose.PASSWORD_RESET,
          userId: user.id,
        },
        transaction,
      )

      await transaction.user.update({
        data: { password: passwordHash },
        where: { id: user.id },
      })

      await transaction.verificationToken.deleteMany({
        where: { purpose: VerificationPurpose.PASSWORD_RESET, userId: user.id },
      })
    },
    { timeout: INTERACTIVE_TRANSACTION_TIMEOUT_MS },
  )
}

export async function getPublicUser(userId) {
  const user = await prisma.user.findUnique({
    select: {
      email: true,
      id: true,
      name: true,
      role: true,
    },
    where: { id: userId },
  })

  if (!user) {
    throw new AppError('The authenticated user no longer exists', 401, 'INVALID_TOKEN')
  }

  return user
}
