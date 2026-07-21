import {
  getPublicUser,
  loginUser,
  registerStudent,
  requestPasswordReset,
  resendEmailVerificationOtp,
  resetUserPassword,
  verifyEmailAddress,
} from '../services/authService.js'
import {
  validateEmailOnly,
  validateEmailOtp,
  validateLogin,
  validatePasswordReset,
  validateRegistration,
} from '../utils/authValidation.js'

export async function register(request, response) {
  const user = await registerStudent(validateRegistration(request.body))

  response.status(201).json({
    status: 'success',
    message: 'Registration successful. Check your email for the verification code.',
    data: { user },
  })
}

export async function verifyEmail(request, response) {
  const user = await verifyEmailAddress(validateEmailOtp(request.body))

  response.status(200).json({
    status: 'success',
    message: 'Email verified successfully.',
    data: { user },
  })
}

export async function resendOtp(request, response) {
  await resendEmailVerificationOtp(validateEmailOnly(request.body))

  response.status(200).json({
    status: 'success',
    message: 'If the account is eligible, a new verification code has been sent.',
  })
}

export async function login(request, response) {
  const result = await loginUser(validateLogin(request.body))

  response.status(200).json({
    status: 'success',
    data: result,
  })
}

export async function forgotPassword(request, response) {
  const message = await requestPasswordReset(validateEmailOnly(request.body))

  response.status(200).json({
    status: 'success',
    message,
  })
}

export async function resetPassword(request, response) {
  await resetUserPassword(validatePasswordReset(request.body))

  response.status(200).json({
    status: 'success',
    message: 'Password reset successfully.',
  })
}

export async function getMe(request, response) {
  const user = await getPublicUser(request.user.userId)

  response.status(200).json({
    status: 'success',
    data: { user },
  })
}

export function adminCheck(_request, response) {
  response.status(200).json({
    status: 'success',
    message: 'Administrator access confirmed.',
  })
}
