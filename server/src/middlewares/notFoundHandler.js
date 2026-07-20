import { AppError } from '../utils/AppError.js'

export function notFoundHandler(request, _response, next) {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404, 'NOT_FOUND'))
}
