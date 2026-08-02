import { AppError } from './AppError.js'

const MAX_RESOURCE_ID_LENGTH = 100
const MAX_ANSWER_TEXT_LENGTH = 100_000
const ATTEMPT_VIOLATION_TYPES = new Set(['FULLSCREEN_EXIT', 'TAB_SWITCH'])

function validationError(message, field) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field })
}

function assertObject(value, field = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError(`${field} must be a JSON object`, field)
  }
}

function assertAllowedFields(object, fields) {
  const unsupported = Object.keys(object).find((field) => !fields.has(field))

  if (unsupported) {
    throw validationError(`${unsupported} is not an allowed field`, unsupported)
  }
}

export function validateStudentResourceId(value, field = 'id') {
  if (typeof value !== 'string') {
    throw validationError(`A valid ${field} is required`, field)
  }

  const normalized = value.trim()

  if (normalized.length < 1 || normalized.length > MAX_RESOURCE_ID_LENGTH) {
    throw validationError(`A valid ${field} is required`, field)
  }

  return normalized
}

export function validateStudentAnswer(body) {
  assertObject(body)
  assertAllowedFields(body, new Set(['answerText', 'questionId', 'selectedOptionId']))

  const questionId = validateStudentResourceId(body.questionId, 'questionId')
  let answerText = null
  let selectedOptionId = null

  if (Object.hasOwn(body, 'answerText') && body.answerText !== null) {
    if (typeof body.answerText !== 'string') {
      throw validationError('answerText must be a string or null', 'answerText')
    }

    if (body.answerText.trim().length < 1 || body.answerText.length > MAX_ANSWER_TEXT_LENGTH) {
      throw validationError(
        `answerText must contain between 1 and ${MAX_ANSWER_TEXT_LENGTH} characters`,
        'answerText',
      )
    }

    answerText = body.answerText
  }

  if (Object.hasOwn(body, 'selectedOptionId') && body.selectedOptionId !== null) {
    selectedOptionId = validateStudentResourceId(body.selectedOptionId, 'selectedOptionId')
  }

  const representationCount = Number(answerText !== null) + Number(selectedOptionId !== null)

  if (representationCount !== 1) {
    throw validationError('Provide exactly one of selectedOptionId or answerText', 'body')
  }

  return { answerText, questionId, selectedOptionId }
}

export function validateAttemptViolation(body) {
  assertObject(body)
  assertAllowedFields(body, new Set(['type']))

  if (typeof body.type !== 'string' || !ATTEMPT_VIOLATION_TYPES.has(body.type)) {
    throw validationError('type must be TAB_SWITCH or FULLSCREEN_EXIT', 'type')
  }

  return { type: body.type }
}
