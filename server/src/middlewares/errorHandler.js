import { env } from '../config/env.js'

export function errorHandler(error, _request, response, _next) {
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
    console.error(error)
  }

  response.status(statusCode).json(payload)
}
