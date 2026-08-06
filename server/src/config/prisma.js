import { PrismaClient } from '@prisma/client'
import { env } from './env.js'
import { logger } from './logger.js'

export const prisma = new PrismaClient({
  log:
    env.nodeEnv === 'development'
      ? [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [{ emit: 'event', level: 'error' }],
})

prisma.$on('error', (event) => {
  logger.error({ databaseTarget: event.target }, 'Database client error')
})

if (env.nodeEnv === 'development') {
  prisma.$on('warn', (event) => {
    logger.warn({ databaseTarget: event.target }, 'Database client warning')
  })
}
