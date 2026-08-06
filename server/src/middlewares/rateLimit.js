import { rateLimit } from 'express-rate-limit'
import { AppError } from '../utils/AppError.js'

export function createRateLimiter({ code, maxRequests, message, windowMs }) {
  return rateLimit({
    handler(_request, _response, next) {
      next(new AppError(message, 429, code))
    },
    legacyHeaders: false,
    limit: maxRequests,
    standardHeaders: 'draft-6',
    windowMs,
  })
}
