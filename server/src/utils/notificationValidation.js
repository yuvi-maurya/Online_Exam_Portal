import { AppError } from './AppError.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE = 100_000
const MAX_PAGE_SIZE = 100
const MAX_RESOURCE_ID_LENGTH = 100
const PAGINATION_FIELDS = new Set(['limit', 'page'])

function validationError(message, field) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field })
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

export function validateNotificationPagination(query) {
  const unsupportedField = Object.keys(query).find((field) => !PAGINATION_FIELDS.has(field))

  if (unsupportedField) {
    throw validationError(`${unsupportedField} is not an allowed field`, unsupportedField)
  }

  return {
    limit: parsePositiveInteger(query.limit, {
      defaultValue: DEFAULT_PAGE_SIZE,
      field: 'limit',
      maximum: MAX_PAGE_SIZE,
    }),
    page: parsePositiveInteger(query.page, {
      defaultValue: 1,
      field: 'page',
      maximum: MAX_PAGE,
    }),
  }
}

export function validateNotificationId(value) {
  if (typeof value !== 'string') {
    throw validationError('A valid notification id is required', 'id')
  }

  const id = value.trim()

  if (id.length < 1 || id.length > MAX_RESOURCE_ID_LENGTH) {
    throw validationError('A valid notification id is required', 'id')
  }

  return id
}
