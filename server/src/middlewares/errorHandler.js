import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

export function errorHandler(error, request, response, _next) {
  const statusCode = error.statusCode ?? error.status ?? 500
  const isInternalError = statusCode >= 500

  const payload = {
    status: 'error',
    error: {
      code: error.code ?? 'INTERNAL_SERVER_ERROR',
      message:
        isInternalError && env.nodeEnv === 'production'
          ? 'An unexpected error occurred'
          : error.message,
    },
  }

  if (env.nodeEnv !== 'production' && error.details) {
    payload.error.details = error.details
  }

  if (isInternalError) {
    const requestLog = request.log ?? logger

    requestLog.error(
      {
        err: error,
        method: request.method,
        requestId: request.id,
        statusCode,
      },
      'Request failed',
    )
  }

  response.status(statusCode).json(payload)
}
