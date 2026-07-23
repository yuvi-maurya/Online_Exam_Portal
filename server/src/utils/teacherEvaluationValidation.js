import { AppError } from './AppError.js'

function validationError(message, field) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field })
}

function assertObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError('body must be a JSON object', 'body')
  }
}

export function validateManualGrade(body) {
  assertObject(body)

  const fields = Object.keys(body)
  const unsupportedField = fields.find((field) => field !== 'marksAwarded')

  if (unsupportedField) {
    throw validationError(`${unsupportedField} is not an allowed field`, unsupportedField)
  }

  if (!Object.hasOwn(body, 'marksAwarded')) {
    throw validationError('marksAwarded is required', 'marksAwarded')
  }

  if (
    typeof body.marksAwarded !== 'number' ||
    !Number.isFinite(body.marksAwarded) ||
    body.marksAwarded < 0
  ) {
    throw validationError(
      'marksAwarded must be a finite number greater than or equal to 0',
      'marksAwarded',
    )
  }

  return body.marksAwarded
}
