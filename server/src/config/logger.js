import pino from 'pino'
import { requestContext } from '../utils/requestContext.js'
import { env } from './env.js'

const DEFAULT_LOG_LEVEL = env.nodeEnv === 'test' ? 'silent' : 'info'

function serializeError(error) {
  if (!error || typeof error !== 'object') {
    return { name: 'UnknownError' }
  }

  const stackFrames =
    typeof error.stack === 'string'
      ? error.stack.split(/\r?\n/).slice(1).join('\n') || undefined
      : undefined

  return {
    code: typeof error.code === 'string' ? error.code : undefined,
    name: typeof error.name === 'string' ? error.name : 'Error',
    stack: stackFrames,
    statusCode: Number.isInteger(error.statusCode) ? error.statusCode : undefined,
  }
}

export const logger = pino({
  base: {
    environment: env.nodeEnv,
    service: 'exam-portal-api',
  },
  level: env.logLevel ?? DEFAULT_LOG_LEVEL,
  mixin() {
    const context = requestContext.getStore()

    return context?.requestId ? { requestId: context.requestId } : {}
  },
  redact: {
    censor: '[REDACTED]',
    paths: [
      'authorization',
      'apiKey',
      'apiSecret',
      'cookie',
      'jwtSecret',
      'pass',
      'password',
      'newPassword',
      'otp',
      'token',
      'accessToken',
      'refreshToken',
      'headers.authorization',
      'headers.cookie',
      'headers.set-cookie',
      'auth.pass',
      'cloudinary.apiKey',
      'cloudinary.apiSecret',
      'request.headers.authorization',
      'request.headers.cookie',
      'response.headers.set-cookie',
      'smtp.pass',
    ],
  },
  serializers: {
    err: serializeError,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})
