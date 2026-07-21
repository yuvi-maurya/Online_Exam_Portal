import { AppError } from '../utils/AppError.js'

const CLEANUP_INTERVAL_REQUESTS = 1_000

export function createRateLimiter({ code, maxRequests, message, windowMs }) {
  const clients = new Map()
  let requestCount = 0

  return function rateLimiter(request, response, next) {
    const now = Date.now()
    const clientKey = request.ip ?? request.socket.remoteAddress ?? 'unknown'
    let client = clients.get(clientKey)

    if (!client || client.resetAt <= now) {
      client = { count: 0, resetAt: now + windowMs }
      clients.set(clientKey, client)
    }

    client.count += 1
    requestCount += 1

    if (requestCount % CLEANUP_INTERVAL_REQUESTS === 0) {
      for (const [key, value] of clients.entries()) {
        if (value.resetAt <= now) {
          clients.delete(key)
        }
      }
    }

    const remaining = Math.max(maxRequests - client.count, 0)
    const retryAfterSeconds = Math.max(Math.ceil((client.resetAt - now) / 1_000), 1)

    response.set('RateLimit-Limit', String(maxRequests))
    response.set('RateLimit-Remaining', String(remaining))
    response.set('RateLimit-Reset', String(Math.ceil(client.resetAt / 1_000)))

    if (client.count > maxRequests) {
      response.set('Retry-After', String(retryAfterSeconds))
      next(new AppError(message, 429, code))
      return
    }

    next()
  }
}
