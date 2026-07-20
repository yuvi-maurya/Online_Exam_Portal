import { app } from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'

const httpServer = app.listen(env.port, () => {
  console.info(`Exam Portal API listening on http://localhost:${env.port}`)
})

let isShuttingDown = false

async function shutdown(signal) {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.info(`${signal} received; closing the HTTP server`)

  const forcedExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out')
    process.exit(1)
  }, 10_000)

  forcedExitTimer.unref()

  httpServer.close(async () => {
    await prisma.$disconnect()
    clearTimeout(forcedExitTimer)
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
