import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { prisma } from './config/prisma.js'
import {
  shutdownNotificationReminderJobs,
  startNotificationReminderJob,
} from './jobs/notificationReminderJob.js'

const httpServer = app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Exam Portal API listening')
})
const notificationReminderTask = env.enableCronJobs ? startNotificationReminderJob() : null

let isShuttingDown = false

async function shutdown(signal) {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  logger.info({ signal }, 'Shutdown signal received; closing the HTTP server')

  const forcedExitTimer = setTimeout(() => {
    logger.fatal({ signal, timeoutMs: 10_000 }, 'Graceful shutdown timed out')
    process.exit(1)
  }, 10_000)

  forcedExitTimer.unref()

  try {
    if (notificationReminderTask) {
      await shutdownNotificationReminderJobs(5_000)
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to stop the notification reminder job cleanly')
  }

  httpServer.close(async () => {
    await prisma.$disconnect()
    clearTimeout(forcedExitTimer)
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
