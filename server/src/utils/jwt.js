import jsonwebtoken from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from './AppError.js'

const JWT_ALGORITHM = 'HS256'
const JWT_AUDIENCE = 'exam-portal-client'
const JWT_ISSUER = 'exam-portal-api'

function getJwtSecret() {
  if (!env.jwtSecret) {
    throw new AppError('Authentication service is not configured', 500, 'AUTH_CONFIGURATION_ERROR')
  }

  return env.jwtSecret
}

export function signAuthToken({ role, userId }) {
  return jsonwebtoken.sign({ role, userId }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    audience: JWT_AUDIENCE,
    expiresIn: env.jwtExpiresIn,
    issuer: JWT_ISSUER,
  })
}

export function verifyAuthToken(token) {
  return jsonwebtoken.verify(token, getJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
  })
}
