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
    errors.name = 'Subject name must be between 2 and 100 characters.'
  }

  if (!SUBJECT_CODE_PATTERN.test(normalized.code)) {
    errors.code =
      'Use 2 to 30 uppercase letters, numbers, hyphens, or underscores, starting with a letter or number.'
  }

  if (normalized.description.length > 2_000) {
    errors.description = 'Description must not exceed 2000 characters.'
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
