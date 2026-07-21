import { AppError } from './AppError.js'
import { validateEmail, validateName } from './authValidation.js'

const MAX_PAGE = 100_000
const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 20
const SUBJECT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,29}$/

function validationError(message, field) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field })
}

function assertBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Request body must be a JSON object', 'body')
  }
}

function assertAllowedFields(body, allowedFields) {
  const unsupportedField = Object.keys(body).find((field) => !allowedFields.has(field))

  if (unsupportedField) {
    throw validationError(`${unsupportedField} is not an allowed field`, unsupportedField)
  }
}

function assertHasAtLeastOneField(body) {
  if (Object.keys(body).length === 0) {
    throw validationError('At least one field must be provided', 'body')
  }
}

function validateSubjectName(value) {
  if (typeof value !== 'string') {
    throw validationError('Subject name is required', 'name')
  }

  const name = value.trim().replace(/\s+/g, ' ')

  if (name.length < 2 || name.length > 100) {
    throw validationError('Subject name must be between 2 and 100 characters', 'name')
  }

  return name
}

function validateSubjectCode(value) {
  if (typeof value !== 'string') {
    throw validationError('Subject code is required', 'code')
  }

  const code = value.trim().toUpperCase()

  if (!SUBJECT_CODE_PATTERN.test(code)) {
    throw validationError(
      'Subject code must be 2 to 30 characters using letters, numbers, hyphens, or underscores',
      'code',
    )
  }

  return code
}

function validateSubjectDescription(value) {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw validationError('Description must be a string or null', 'description')
  }

  const description = value.trim()

  if (description.length > 2_000) {
    throw validationError('Description must not exceed 2000 characters', 'description')
  }

  return description || null
}

function parsePositiveInteger(value, { defaultValue, field, maximum }) {
  if (value === undefined) {
    return defaultValue
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw validationError(`${field} must be a positive integer`, field)
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw validationError(`${field} must be between 1 and ${maximum}`, field)
  }

  return parsed
}

export function validateManagedUserCreate(body) {
  assertBody(body)
  assertAllowedFields(body, new Set(['email', 'name']))

  return {
    email: validateEmail(body.email),
    name: validateName(body.name),
  }
}

export function validateManagedUserUpdate(body) {
  assertBody(body)
  assertAllowedFields(body, new Set(['email', 'name']))
  assertHasAtLeastOneField(body)

  const changes = {}

  if (Object.hasOwn(body, 'email')) {
    changes.email = validateEmail(body.email)
  }

  if (Object.hasOwn(body, 'name')) {
    changes.name = validateName(body.name)
  }

  return changes
}

export function validatePagination(query) {
  const page = parsePositiveInteger(query.page, {
    defaultValue: 1,
    field: 'page',
    maximum: MAX_PAGE,
  })
  const limit = parsePositiveInteger(query.limit, {
    defaultValue: DEFAULT_PAGE_SIZE,
    field: 'limit',
    maximum: MAX_PAGE_SIZE,
  })

  if (query.search !== undefined && typeof query.search !== 'string') {
    throw validationError('search must be a string', 'search')
  }

  const search = query.search?.trim().replace(/\s+/g, ' ')

  if (search && search.length > 100) {
    throw validationError('search must not exceed 100 characters', 'search')
  }

  return { limit, page, search: search || undefined }
}

export function validateResourceId(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 100) {
    throw validationError('A valid resource id is required', 'id')
  }

  return value
}

export function validateSubjectCreate(body) {
  assertBody(body)
  assertAllowedFields(body, new Set(['code', 'description', 'name']))

  return {
    code: validateSubjectCode(body.code),
    description: Object.hasOwn(body, 'description')
      ? validateSubjectDescription(body.description)
      : null,
    name: validateSubjectName(body.name),
  }
}

export function validateSubjectUpdate(body) {
  assertBody(body)
  assertAllowedFields(body, new Set(['code', 'description', 'name']))
  assertHasAtLeastOneField(body)

  const changes = {}

  if (Object.hasOwn(body, 'code')) {
    changes.code = validateSubjectCode(body.code)
  }

  if (Object.hasOwn(body, 'description')) {
    changes.description = validateSubjectDescription(body.description)
  }

  if (Object.hasOwn(body, 'name')) {
    changes.name = validateSubjectName(body.name)
  }

  return changes
}
