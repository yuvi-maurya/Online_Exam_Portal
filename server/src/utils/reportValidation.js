import { AppError } from './AppError.js'

const REPORT_QUERY_FIELDS = new Set(['format'])
const REPORT_FORMATS = new Set(['csv', 'json'])

function validationError(message, field) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field })
}

export function validateReportFormat(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw validationError('Query parameters must be an object', 'query')
  }

  const unsupportedField = Object.keys(query).find((field) => !REPORT_QUERY_FIELDS.has(field))

  if (unsupportedField) {
    throw validationError(`${unsupportedField} is not an allowed query parameter`, unsupportedField)
  }

  if (query.format === undefined) {
    return 'json'
  }

  if (typeof query.format !== 'string' || !REPORT_FORMATS.has(query.format)) {
    throw validationError('format must be one of: csv, json', 'format')
  }

  return query.format
}
