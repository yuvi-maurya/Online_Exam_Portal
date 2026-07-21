import { Role } from '@prisma/client'
import { AppError } from '../utils/AppError.js'
import { verifyAuthToken } from '../utils/jwt.js'

const VALID_ROLES = new Set(Object.values(Role))

export function requireAuth(request, _response, next) {
  const authorization = request.get('authorization')

  if (!authorization) {
    next(new AppError('Authentication token is required', 401, 'AUTH_TOKEN_REQUIRED'))
    return
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/)

  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    next(new AppError('Authorization header must use Bearer authentication', 401, 'INVALID_TOKEN'))
    return
  }

  try {
    const payload = verifyAuthToken(token)

    if (
      typeof payload !== 'object' ||
      typeof payload.userId !== 'string' ||
      !VALID_ROLES.has(payload.role)
    ) {
      throw new Error('Token payload is incomplete')
    }

    request.user = payload
    next()
  } catch (error) {
    if (error instanceof AppError && error.code === 'AUTH_CONFIGURATION_ERROR') {
      next(error)
      return
    }

    if (error.name === 'TokenExpiredError') {
      next(new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED'))
      return
    }

    next(new AppError('Authentication token is invalid', 401, 'INVALID_TOKEN'))
  }
}

export function requireRole(...roles) {
  const allowedRoles = new Set(roles)

  return function roleGuard(request, _response, next) {
    if (!request.user) {
      next(new AppError('Authentication is required', 401, 'AUTH_TOKEN_REQUIRED'))
      return
    }

    if (!allowedRoles.has(request.user.role)) {
      next(new AppError('You do not have permission to access this resource', 403, 'FORBIDDEN'))
      return
    }

    next()
  }
}
