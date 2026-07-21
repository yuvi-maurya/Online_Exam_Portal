import { AppError } from './AppError.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_PATTERN = /^\d{6}$/
const PASSWORD_MINIMUM_LENGTH = 8
const PASSWORD_MAXIMUM_BYTES = 72

function validationError(message, field) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field })
}

function assertBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Request body must be a JSON object', 'body')
  }
}

export function validateEmail(value) {
  if (typeof value !== 'string') {
    throw validationError('Email is required', 'email')
  }

  const email = value.trim().toLowerCase()

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw validationError('A valid email address is required', 'email')
  }

  return email
}

export function validateName(value) {
  if (typeof value !== 'string') {
    throw validationError('Name is required', 'name')
  }

  const name = value.trim().replace(/\s+/g, ' ')

  if (name.length < 2 || name.length > 100) {
    throw validationError('Name must be between 2 and 100 characters', 'name')
  }

  return name
}

function validatePassword(value, field = 'password') {
  if (typeof value !== 'string') {
    throw validationError('Password is required', field)
  }

  if (value.length < PASSWORD_MINIMUM_LENGTH) {
    throw validationError(`Password must be at least ${PASSWORD_MINIMUM_LENGTH} characters`, field)
  }

  if (Buffer.byteLength(value, 'utf8') > PASSWORD_MAXIMUM_BYTES) {
    throw validationError(`Password must not exceed ${PASSWORD_MAXIMUM_BYTES} bytes`, field)
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw validationError('Password must contain at least one letter and one number', field)
  }

  return value
}

function validateLoginPassword(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw validationError('Password is required', 'password')
  }

  if (Buffer.byteLength(value, 'utf8') > PASSWORD_MAXIMUM_BYTES) {
    throw validationError(`Password must not exceed ${PASSWORD_MAXIMUM_BYTES} bytes`, 'password')
  }

  return value
}

function validateOtp(value) {
  const otp = typeof value === 'number' && Number.isInteger(value) ? String(value) : value

  if (typeof otp !== 'string' || !OTP_PATTERN.test(otp)) {
    throw validationError('OTP must be a 6-digit code', 'otp')
  }

  return otp
}

export function validateRegistration(body) {
  assertBody(body)

  if (Object.hasOwn(body, 'role')) {
    throw new AppError(
      'Role cannot be selected during public registration',
      400,
      'ROLE_NOT_ALLOWED',
    )
  }

  return {
    email: validateEmail(body.email),
    name: validateName(body.name),
    password: validatePassword(body.password),
  }
}

export function validateEmailOtp(body) {
  assertBody(body)

  return {
    email: validateEmail(body.email),
    otp: validateOtp(body.otp),
  }
}

export function validateEmailOnly(body) {
  assertBody(body)
  return { email: validateEmail(body.email) }
}

export function validateLogin(body) {
  assertBody(body)

  return {
    email: validateEmail(body.email),
    password: validateLoginPassword(body.password),
  }
}

export function validatePasswordReset(body) {
  assertBody(body)

  return {
    email: validateEmail(body.email),
    newPassword: validatePassword(body.newPassword, 'newPassword'),
    otp: validateOtp(body.otp),
  }
}
