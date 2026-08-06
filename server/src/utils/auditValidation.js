import { AppError } from './AppError.js'

const ACTION_PATTERN = /^[A-Z][A-Z0-9_]{1,99}$/
const ALLOWED_QUERY_FIELDS = new Set(['action', 'actorId', 'limit', 'page'])
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE = 100_000
const MAX_PAGE_SIZE = 100

function validationError(message, field) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field })
}

function parsePositiveInteger(value, { defaultValue, field, maximum }) {
  if (value === undefined) return defaultValue

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw validationError(`${field} must be a positive integer`, field)
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw validationError(`${field} must be between 1 and ${maximum}`, field)
  }

  return parsed
}

function validateActorId(value) {
  if (value === undefined) return undefined

  if (typeof value !== 'string') {
    throw validationError('actorId must be a string', 'actorId')
  }

  const actorId = value.trim()

  if (!actorId || actorId.length > 100) {
    throw validationError('actorId must be between 1 and 100 characters', 'actorId')
  }

  return actorId
}

function validateAction(value) {
  if (value === undefined) return undefined

  if (typeof value !== 'string') {
    throw validationError('action must be a string', 'action')
  }

  const action = value.trim().toUpperCase()

  if (!ACTION_PATTERN.test(action)) {
    throw validationError('action must be a valid audit action', 'action')
  }

  return action
}

export function validateAuditLogQuery(query) {
  const unsupportedField = Object.keys(query).find((field) => !ALLOWED_QUERY_FIELDS.has(field))

  if (unsupportedField) {
    throw validationError(`${unsupportedField} is not an allowed query field`, unsupportedField)
  }

  return {
    action: validateAction(query.action),
    actorId: validateActorId(query.actorId),
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
