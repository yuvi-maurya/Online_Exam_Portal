import { DifficultyLevel, ExamType, QuestionType } from '@prisma/client'
import { AppError } from './AppError.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE = 100_000
const MAX_PAGE_SIZE = 100
const MAX_MARKS = 1_000_000
const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/
const CHOICE_TYPES = new Set([QuestionType.MCQ, QuestionType.TRUE_FALSE])
const OPEN_ENDED_TYPES = new Set([
  QuestionType.CODING,
  QuestionType.ESSAY,
  QuestionType.FILL_BLANK,
  QuestionType.SHORT_ANSWER,
])

function validationError(message, field, details) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field, ...details })
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

function assertHasFields(object) {
  if (Object.keys(object).length === 0) {
    throw validationError('At least one field must be provided', 'body')
  }
}

function validateEnum(value, enumObject, field) {
  if (typeof value !== 'string') {
    throw validationError(`${field} is required`, field)
  }

  const normalized = value.trim().toUpperCase()
  const allowed = Object.values(enumObject)

  if (!allowed.includes(normalized)) {
    throw validationError(`${field} must be one of: ${allowed.join(', ')}`, field)
  }

  return normalized
}

function validateTrimmedString(value, { field, maximum, minimum = 1 }) {
  if (typeof value !== 'string') {
    throw validationError(`${field} is required`, field)
  }

  const normalized = value.trim()

  if (normalized.length < minimum || normalized.length > maximum) {
    throw validationError(`${field} must be between ${minimum} and ${maximum} characters`, field)
  }

  return normalized
}

function validateInteger(value, { field, maximum, minimum }) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw validationError(`${field} must be an integer between ${minimum} and ${maximum}`, field)
  }

  return value
}

function validateBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw validationError(`${field} must be a boolean`, field)
  }

  return value
}

function parsePositiveQueryInteger(value, { defaultValue, field, maximum }) {
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

function validateQuestionContent(value) {
  return validateTrimmedString(value, { field: 'content', maximum: 20_000 })
}

function validateCorrectAnswerText(value, { nullable = false } = {}) {
  if (nullable && value === null) {
    return null
  }

  return validateTrimmedString(value, { field: 'correctAnswerText', maximum: 20_000 })
}

function validateQuestionOptions(value) {
  if (!Array.isArray(value)) {
    throw validationError('options must be an array', 'options')
  }

  if (value.length > 100) {
    throw validationError('options must not contain more than 100 entries', 'options')
  }

  const options = value.map((option, index) => {
    assertObject(option, `options[${index}]`)
    assertAllowedFields(option, new Set(['isCorrect', 'order', 'text']))

    return {
      isCorrect: validateBoolean(option.isCorrect, `options[${index}].isCorrect`),
      order: validateInteger(option.order, {
        field: `options[${index}].order`,
        maximum: 10_000,
        minimum: 0,
      }),
      text: validateTrimmedString(option.text, {
        field: `options[${index}].text`,
        maximum: 2_000,
      }),
    }
  })

  const orders = new Set(options.map((option) => option.order))
  if (orders.size !== options.length) {
    throw validationError('Each option order must be unique', 'options')
  }

  const normalizedTexts = new Set(options.map((option) => option.text.toLowerCase()))
  if (normalizedTexts.size !== options.length) {
    throw validationError('Each option text must be unique', 'options')
  }

  return options.sort((left, right) => left.order - right.order)
}

function validateTabSwitchLimit(value) {
  if (value === null) {
    return null
  }

  return validateInteger(value, { field: 'tabSwitchLimit', maximum: 10_000, minimum: 0 })
}

function validateDate(value, field) {
  const match = typeof value === 'string' ? value.match(ISO_DATE_TIME_PATTERN) : null

  if (!match) {
    throw validationError(`${field} must be an ISO date-time string with a timezone`, field)
  }

  const [, year, month, day] = match
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()

  if (Number(day) > daysInMonth) {
    throw validationError(`${field} must be a valid ISO date-time string`, field)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw validationError(`${field} must be a valid ISO date-time string`, field)
  }

  return date
}

export function validateTeacherResourceId(value, field = 'id') {
  if (typeof value !== 'string') {
    throw validationError(`A valid ${field} is required`, field)
  }

  const id = value.trim()

  if (id.length === 0 || id.length > 100) {
    throw validationError(`A valid ${field} is required`, field)
  }

  return id
}

export function validateCompleteQuestionDefinition(question) {
  const options = validateQuestionOptions(question.options ?? [])

  if (CHOICE_TYPES.has(question.type)) {
    const exactOptions = question.type === QuestionType.TRUE_FALSE ? 2 : undefined

    if (options.length < 2 || (exactOptions && options.length !== exactOptions)) {
      const requirement = exactOptions ? 'exactly 2' : 'at least 2'
      throw validationError(`${question.type} questions require ${requirement} options`, 'options')
    }

    if (options.filter((option) => option.isCorrect).length !== 1) {
      throw validationError(
        `${question.type} questions require exactly one correct option`,
        'options',
      )
    }

    if (question.correctAnswerText !== null && question.correctAnswerText !== undefined) {
      throw validationError(
        'correctAnswerText is not allowed for MCQ or TRUE_FALSE questions',
        'correctAnswerText',
      )
    }

    return { ...question, correctAnswerText: null, options }
  }

  if (!OPEN_ENDED_TYPES.has(question.type)) {
    throw validationError('Unsupported question type', 'type')
  }

  if (options.length > 0) {
    throw validationError(`${question.type} questions cannot include options`, 'options')
  }

  return {
    ...question,
    correctAnswerText: validateCorrectAnswerText(question.correctAnswerText),
    options: [],
  }
}

export function validateQuestionCreate(body) {
  assertObject(body)
  assertAllowedFields(
    body,
    new Set([
      'content',
      'correctAnswerText',
      'difficulty',
      'marks',
      'options',
      'subjectId',
      'type',
    ]),
  )

  return validateCompleteQuestionDefinition({
    content: validateQuestionContent(body.content),
    correctAnswerText: Object.hasOwn(body, 'correctAnswerText')
      ? validateCorrectAnswerText(body.correctAnswerText, { nullable: true })
      : null,
    difficulty: validateEnum(body.difficulty, DifficultyLevel, 'difficulty'),
    marks: validateInteger(body.marks, { field: 'marks', maximum: MAX_MARKS, minimum: 1 }),
    options: Object.hasOwn(body, 'options') ? validateQuestionOptions(body.options) : [],
    subjectId: validateTeacherResourceId(body.subjectId, 'subjectId'),
    type: validateEnum(body.type, QuestionType, 'type'),
  })
}

export function validateQuestionUpdate(body) {
  assertObject(body)
  assertAllowedFields(
    body,
    new Set([
      'content',
      'correctAnswerText',
      'difficulty',
      'marks',
      'options',
      'subjectId',
      'type',
    ]),
  )
  assertHasFields(body)

  const changes = {}

  if (Object.hasOwn(body, 'content')) changes.content = validateQuestionContent(body.content)
  if (Object.hasOwn(body, 'correctAnswerText')) {
    changes.correctAnswerText = validateCorrectAnswerText(body.correctAnswerText, {
      nullable: true,
    })
  }
  if (Object.hasOwn(body, 'difficulty')) {
    changes.difficulty = validateEnum(body.difficulty, DifficultyLevel, 'difficulty')
  }
  if (Object.hasOwn(body, 'marks')) {
    changes.marks = validateInteger(body.marks, {
      field: 'marks',
      maximum: MAX_MARKS,
      minimum: 1,
    })
  }
  if (Object.hasOwn(body, 'options')) changes.options = validateQuestionOptions(body.options)
  if (Object.hasOwn(body, 'subjectId')) {
    changes.subjectId = validateTeacherResourceId(body.subjectId, 'subjectId')
  }
  if (Object.hasOwn(body, 'type')) changes.type = validateEnum(body.type, QuestionType, 'type')

  return changes
}

export function validateQuestionFilters(query) {
  assertAllowedFields(query, new Set(['difficulty', 'limit', 'page', 'subjectId', 'type']))

  return {
    difficulty:
      query.difficulty === undefined
        ? undefined
        : validateEnum(query.difficulty, DifficultyLevel, 'difficulty'),
    limit: parsePositiveQueryInteger(query.limit, {
      defaultValue: DEFAULT_PAGE_SIZE,
      field: 'limit',
      maximum: MAX_PAGE_SIZE,
    }),
    page: parsePositiveQueryInteger(query.page, {
      defaultValue: 1,
      field: 'page',
      maximum: MAX_PAGE,
    }),
    subjectId:
      query.subjectId === undefined
        ? undefined
        : validateTeacherResourceId(query.subjectId, 'subjectId'),
    type: query.type === undefined ? undefined : validateEnum(query.type, QuestionType, 'type'),
  }
}

export function validateExamCreate(body) {
  assertObject(body)
  assertAllowedFields(
    body,
    new Set([
      'durationMinutes',
      'fullScreenRequired',
      'passingMarks',
      'shuffleOptions',
      'shuffleQuestions',
      'subjectId',
      'tabSwitchLimit',
      'title',
      'type',
      'webcamMonitoring',
    ]),
  )

  return {
    durationMinutes: validateInteger(body.durationMinutes, {
      field: 'durationMinutes',
      maximum: 1_440,
      minimum: 1,
    }),
    fullScreenRequired: Object.hasOwn(body, 'fullScreenRequired')
      ? validateBoolean(body.fullScreenRequired, 'fullScreenRequired')
      : true,
    passingMarks: validateInteger(body.passingMarks, {
      field: 'passingMarks',
      maximum: MAX_MARKS,
      minimum: 0,
    }),
    shuffleOptions: Object.hasOwn(body, 'shuffleOptions')
      ? validateBoolean(body.shuffleOptions, 'shuffleOptions')
      : false,
    shuffleQuestions: Object.hasOwn(body, 'shuffleQuestions')
      ? validateBoolean(body.shuffleQuestions, 'shuffleQuestions')
      : false,
    subjectId: validateTeacherResourceId(body.subjectId, 'subjectId'),
    tabSwitchLimit: Object.hasOwn(body, 'tabSwitchLimit')
      ? validateTabSwitchLimit(body.tabSwitchLimit)
      : null,
    title: validateTrimmedString(body.title, { field: 'title', maximum: 200, minimum: 3 }),
    type: validateEnum(body.type, ExamType, 'type'),
    webcamMonitoring: Object.hasOwn(body, 'webcamMonitoring')
      ? validateBoolean(body.webcamMonitoring, 'webcamMonitoring')
      : false,
  }
}

export function validateExamUpdate(body) {
  assertObject(body)
  assertAllowedFields(
    body,
    new Set([
      'durationMinutes',
      'fullScreenRequired',
      'passingMarks',
      'shuffleOptions',
      'shuffleQuestions',
      'subjectId',
      'tabSwitchLimit',
      'title',
      'type',
      'webcamMonitoring',
    ]),
  )
  assertHasFields(body)

  const changes = {}

  if (Object.hasOwn(body, 'durationMinutes')) {
    changes.durationMinutes = validateInteger(body.durationMinutes, {
      field: 'durationMinutes',
      maximum: 1_440,
      minimum: 1,
    })
  }
  if (Object.hasOwn(body, 'fullScreenRequired')) {
    changes.fullScreenRequired = validateBoolean(body.fullScreenRequired, 'fullScreenRequired')
  }
  if (Object.hasOwn(body, 'passingMarks')) {
    changes.passingMarks = validateInteger(body.passingMarks, {
      field: 'passingMarks',
      maximum: MAX_MARKS,
      minimum: 0,
    })
  }
  if (Object.hasOwn(body, 'shuffleOptions')) {
    changes.shuffleOptions = validateBoolean(body.shuffleOptions, 'shuffleOptions')
  }
  if (Object.hasOwn(body, 'shuffleQuestions')) {
    changes.shuffleQuestions = validateBoolean(body.shuffleQuestions, 'shuffleQuestions')
  }
  if (Object.hasOwn(body, 'subjectId')) {
    changes.subjectId = validateTeacherResourceId(body.subjectId, 'subjectId')
  }
  if (Object.hasOwn(body, 'tabSwitchLimit')) {
    changes.tabSwitchLimit = validateTabSwitchLimit(body.tabSwitchLimit)
  }
  if (Object.hasOwn(body, 'title')) {
    changes.title = validateTrimmedString(body.title, {
      field: 'title',
      maximum: 200,
      minimum: 3,
    })
  }
  if (Object.hasOwn(body, 'type')) changes.type = validateEnum(body.type, ExamType, 'type')
  if (Object.hasOwn(body, 'webcamMonitoring')) {
    changes.webcamMonitoring = validateBoolean(body.webcamMonitoring, 'webcamMonitoring')
  }

  return changes
}

export function validateExamSchedule(body) {
  assertObject(body)
  assertAllowedFields(body, new Set(['scheduledEnd', 'scheduledStart']))

  const scheduledStart = validateDate(body.scheduledStart, 'scheduledStart')
  const scheduledEnd = validateDate(body.scheduledEnd, 'scheduledEnd')

  if (scheduledStart.getTime() <= Date.now()) {
    throw validationError('scheduledStart must be in the future', 'scheduledStart')
  }

  if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
    throw validationError('scheduledEnd must be after scheduledStart', 'scheduledEnd')
  }

  return { scheduledEnd, scheduledStart }
}

export function validateExamQuestionAttachments(body) {
  const entries = Array.isArray(body) ? body : body?.questions

  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 100) {
    throw validationError('questions must contain between 1 and 100 entries', 'questions')
  }

  if (!Array.isArray(body)) {
    assertObject(body)
    assertAllowedFields(body, new Set(['questions']))
  }

  const attachments = entries.map((entry, index) => {
    assertObject(entry, `questions[${index}]`)
    assertAllowedFields(entry, new Set(['marks', 'order', 'questionId']))

    return {
      marks: validateInteger(entry.marks, {
        field: `questions[${index}].marks`,
        maximum: MAX_MARKS,
        minimum: 1,
      }),
      order: validateInteger(entry.order, {
        field: `questions[${index}].order`,
        maximum: 1_000_000,
        minimum: 0,
      }),
      questionId: validateTeacherResourceId(entry.questionId, `questions[${index}].questionId`),
    }
  })

  if (new Set(attachments.map((entry) => entry.questionId)).size !== attachments.length) {
    throw validationError('Each questionId may only be attached once per request', 'questions')
  }

  if (new Set(attachments.map((entry) => entry.order)).size !== attachments.length) {
    throw validationError('Each attached question order must be unique', 'questions')
  }

  return attachments
}

export function validateExamQuestionUpdate(body) {
  assertObject(body)
  assertAllowedFields(body, new Set(['marks', 'order']))
  assertHasFields(body)

  const changes = {}

  if (Object.hasOwn(body, 'marks')) {
    changes.marks = validateInteger(body.marks, {
      field: 'marks',
      maximum: MAX_MARKS,
      minimum: 1,
    })
  }
  if (Object.hasOwn(body, 'order')) {
    changes.order = validateInteger(body.order, {
      field: 'order',
      maximum: 1_000_000,
      minimum: 0,
    })
  }

  return changes
}
