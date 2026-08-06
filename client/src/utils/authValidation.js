import i18n from '../i18n/index.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_PATTERN = /^\d{6}$/

export function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

export function validateEmail(value) {
  const email = normalizeEmail(value)

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return i18n.t('validation.auth.email')
  }

  return ''
}

export function validateName(value) {
  const name = value.trim().replace(/\s+/g, ' ')

  if (name.length < 2 || name.length > 100) {
    return i18n.t('validation.auth.nameLength')
  }

  return ''
}

export function validateStrongPassword(value) {
  if (value.length < 8) {
    return i18n.t('validation.auth.passwordMinimum')
  }

  if (new TextEncoder().encode(value).length > 72) {
    return i18n.t('validation.auth.passwordMaximum')
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return i18n.t('validation.auth.passwordComposition')
  }

  return ''
}

export function validateLoginPassword(value) {
  if (!value) {
    return i18n.t('validation.auth.passwordRequired')
  }

  if (new TextEncoder().encode(value).length > 72) {
    return i18n.t('validation.auth.passwordMaximum')
  }

  return ''
}

export function validateOtp(value) {
  return OTP_PATTERN.test(value) ? '' : i18n.t('validation.auth.otp')
}

export function getValidationErrors(values, validators) {
  return Object.fromEntries(
    Object.entries(validators)
      .map(([field, validator]) => [field, validator(values[field] ?? '')])
      .filter(([, message]) => message),
  )
}
