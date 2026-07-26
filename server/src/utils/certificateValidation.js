const CERTIFICATE_CODE_PATTERN = /^[A-Z0-9]{20}$/

export function normalizeCertificateCode(value) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toUpperCase()
  return CERTIFICATE_CODE_PATTERN.test(normalized) ? normalized : null
}
