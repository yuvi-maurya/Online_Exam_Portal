import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'
import { AppError } from './AppError.js'

const OTP_MINIMUM = 0
const OTP_MAXIMUM_EXCLUSIVE = 1_000_000
const OTP_TTL_MS = 10 * 60 * 1_000
const OTP_DIGEST_CONTEXT = 'exam-portal:otp:v1'

function getOtpSecret() {
  if (!env.jwtSecret) {
    throw new AppError('Verification service is not configured', 500, 'OTP_CONFIGURATION_ERROR')
  }

  return env.jwtSecret
}

export function createOtpDigest({ otp, purpose, userId }) {
  return createHmac('sha256', getOtpSecret())
    .update(`${OTP_DIGEST_CONTEXT}\0${purpose}\0${userId}\0${otp}`)
    .digest('hex')
}

export function generateOtp() {
  return randomInt(OTP_MINIMUM, OTP_MAXIMUM_EXCLUSIVE).toString().padStart(6, '0')
}

export function getOtpExpiration() {
  return new Date(Date.now() + OTP_TTL_MS)
}

export function verifyOtpDigest({ digest, otp, purpose, userId }) {
  const expectedDigest = createOtpDigest({ otp, purpose, userId })
  const actual = Buffer.from(digest, 'utf8')
  const expected = Buffer.from(expectedDigest, 'utf8')

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
