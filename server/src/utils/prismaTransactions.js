import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from './AppError.js'

const SERIALIZABLE_RETRIES = 3
const TRANSACTION_TIMEOUT_MS = 30_000

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

export async function runSerializableTransaction(
  operation,
  {
    conflictCode = 'TRANSACTION_CONFLICT',
    conflictMessage = 'The resource changed concurrently. Please retry.',
    timeoutCode = 'TRANSACTION_TIMEOUT',
    timeoutMessage = 'The update could not complete in time. Please retry.',
  } = {},
) {
  for (let attempt = 1; attempt <= SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: TRANSACTION_TIMEOUT_MS,
      })
    } catch (error) {
      if (isPrismaError(error, 'P2028')) {
        throw new AppError(timeoutMessage, 503, timeoutCode)
      }

      if (!isPrismaError(error, 'P2034')) {
        throw error
      }

      if (attempt === SERIALIZABLE_RETRIES) {
        throw new AppError(conflictMessage, 503, conflictCode)
      }
    }
  }

  throw new AppError(conflictMessage, 503, conflictCode)
}
