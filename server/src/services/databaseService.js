import { prisma } from '../config/prisma.js'
import { logger } from '../config/logger.js'

const DATABASE_PING_TIMEOUT_MS = 3_000

export async function getDatabaseHealth({ log = logger } = {}) {
  let timeoutId
  const startedAt = process.hrtime.bigint()

  try {
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Database health check timed out')),
        DATABASE_PING_TIMEOUT_MS,
      )
    })

    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout])
    return {
      latencyMs: Number((Number(process.hrtime.bigint() - startedAt) / 1_000_000).toFixed(2)),
      status: 'connected',
    }
  } catch (error) {
    const latencyMs = Number((Number(process.hrtime.bigint() - startedAt) / 1_000_000).toFixed(2))

    log.warn({ err: error, latencyMs }, 'Database health check failed')
    return { latencyMs, status: 'disconnected' }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getDatabaseStatus() {
  const health = await getDatabaseHealth()

  return health.status
}
