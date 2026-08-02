const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_PATTERN = /^\d{6}$/

export function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

export function validateEmail(value) {
  const email = normalizeEmail(value)

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address.'
  }

  return ''
}

export function validateName(value) {
  const name = value.trim().replace(/\s+/g, ' ')

  if (name.length < 2 || name.length > 100) {
    return 'Name must be between 2 and 100 characters.'
  }

  return ''
}

export function validateStrongPassword(value) {
  if (value.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  if (new TextEncoder().encode(value).length > 72) {
    return 'Password must not exceed 72 UTF-8 bytes.'
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must contain at least one letter and one number.'
  }

  return ''
}

export function validateLoginPassword(value) {
  if (!value) {
    return 'Enter your password.'
  }

  if (new TextEncoder().encode(value).length > 72) {
    return 'Password must not exceed 72 UTF-8 bytes.'
  }

  return ''
}

export function validateOtp(value) {
  return OTP_PATTERN.test(value) ? '' : 'Enter the 6-digit verification code.'
}

export function getValidationErrors(values, validators) {
  return Object.fromEntries(
    Object.entries(validators)
      .map(([field, validator]) => [field, validator(values[field] ?? '')])
      .filter(([, message]) => message),
  )
}
