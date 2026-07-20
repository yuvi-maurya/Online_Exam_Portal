import { prisma } from '../config/prisma.js'

const DATABASE_PING_TIMEOUT_MS = 3_000

export async function getDatabaseStatus() {
  let timeoutId

  try {
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Database health check timed out')),
        DATABASE_PING_TIMEOUT_MS,
      )
    })

    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout])
    return 'connected'
  } catch (error) {
    console.warn(`Database health check failed: ${error.message}`)
    return 'disconnected'
  } finally {
    clearTimeout(timeoutId)
  }
}
