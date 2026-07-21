import { Role } from '@prisma/client'
import { Router } from 'express'
import {
  adminCheck,
  forgotPassword,
  getMe,
  login,
  register,
  resendOtp,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { createRateLimiter } from '../middlewares/rateLimit.js'

const MINUTE = 60 * 1_000
const authRouter = Router()

const loginLimiter = createRateLimiter({
  code: 'LOGIN_RATE_LIMITED',
  maxRequests: 10,
  message: 'Too many login attempts. Please try again later.',
  windowMs: 15 * MINUTE,
})

const registerLimiter = createRateLimiter({
  code: 'REGISTRATION_RATE_LIMITED',
  maxRequests: 5,
  message: 'Too many registration attempts. Please try again later.',
  windowMs: 60 * MINUTE,
})

const passwordResetLimiter = createRateLimiter({
  code: 'PASSWORD_RESET_RATE_LIMITED',
  maxRequests: 5,
  message: 'Too many password reset requests. Please try again later.',
  windowMs: 15 * MINUTE,
})

const resendOtpLimiter = createRateLimiter({
  code: 'OTP_RATE_LIMITED',
  maxRequests: 3,
  message: 'Too many verification code requests. Please try again later.',
  windowMs: 10 * MINUTE,
})

const emailVerificationLimiter = createRateLimiter({
  code: 'OTP_VALIDATION_RATE_LIMITED',
  maxRequests: 10,
  message: 'Too many verification attempts. Please try again later.',
  windowMs: 15 * MINUTE,
})

const passwordResetValidationLimiter = createRateLimiter({
  code: 'PASSWORD_RESET_VALIDATION_RATE_LIMITED',
  maxRequests: 10,
  message: 'Too many password reset attempts. Please try again later.',
  windowMs: 15 * MINUTE,
})

authRouter.post('/register', registerLimiter, register)
authRouter.post('/verify-email', emailVerificationLimiter, verifyEmail)
authRouter.post('/resend-otp', resendOtpLimiter, resendOtp)
authRouter.post('/login', loginLimiter, login)
authRouter.post('/forgot-password', passwordResetLimiter, forgotPassword)
authRouter.post('/reset-password', passwordResetValidationLimiter, resetPassword)
authRouter.get('/me', requireAuth, getMe)
authRouter.get('/admin-check', requireAuth, requireRole(Role.ADMIN), adminCheck)

export default authRouter
