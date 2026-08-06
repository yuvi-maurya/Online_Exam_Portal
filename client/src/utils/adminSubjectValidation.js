import i18n from '../i18n/index.js'

const SUBJECT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,29}$/

export function normalizeSubjectValues(values) {
  return {
    code: values.code.trim().toUpperCase(),
    description: values.description.trim(),
    name: values.name.trim().replace(/\s+/g, ' '),
  }
}

export function validateSubjectValues(values) {
  const normalized = normalizeSubjectValues(values)
  const errors = {}

  if (normalized.name.length < 2 || normalized.name.length > 100) {
    errors.name = i18n.t('validation.subject.nameLength')
  }

  if (!SUBJECT_CODE_PATTERN.test(normalized.code)) {
    errors.code = i18n.t('validation.subject.codeFormat')
  }

  if (normalized.description.length > 2_000) {
    errors.description = i18n.t('validation.subject.descriptionMaximum')
  }

  return errors
}

export function buildSubjectPayload(values) {
  const normalized = normalizeSubjectValues(values)

  return {
    code: normalized.code,
    description: normalized.description || null,
    name: normalized.name,
  }
}
