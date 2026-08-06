import { createRateLimiter } from './rateLimit.js'

const FIVE_MINUTES = 5 * 60 * 1_000
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const apiReadLimiter = createRateLimiter({
  code: 'API_READ_RATE_LIMITED',
  maxRequests: 300,
  message: 'Too many API requests. Please try again later.',
  windowMs: FIVE_MINUTES,
})

const apiMutationLimiter = createRateLimiter({
  code: 'API_MUTATION_RATE_LIMITED',
  maxRequests: 150,
  message: 'Too many changes requested. Please try again later.',
  windowMs: FIVE_MINUTES,
})

export function apiRateLimiter(request, response, next) {
  const limiter = READ_METHODS.has(request.method) ? apiReadLimiter : apiMutationLimiter

  return limiter(request, response, next)
}
