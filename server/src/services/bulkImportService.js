import { Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { validateManagedUserCreate } from '../utils/adminValidation.js'
import { validateQuestionCreate } from '../utils/teacherValidation.js'
import { createManagedUser } from './adminUserService.js'
import { createTeacherQuestion } from './teacherQuestionService.js'

const QUESTION_OPTION_FIELDS = new Set(['isCorrect', 'order', 'text'])

function rowValidationError(message, field) {
  return new AppError(message, 400, 'VALIDATION_ERROR', { field })
}

function toInteger(value) {
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value, 10)
  }

  return value
}

function isPresent(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function selectCorrectOption(options, selector) {
  if (!isPresent(selector)) {
    throw rowValidationError('correctOption is required for text-only options', 'correctOption')
  }

  const normalizedSelector = selector.trim()
  let correctIndex = -1

  for (const [index, option] of options.entries()) {
    if (typeof option.text !== 'string') {
      throw rowValidationError(`options[${index}].text is required`, 'options')
    }
  }

  if (/^\d+$/.test(normalizedSelector)) {
    const position = Number.parseInt(normalizedSelector, 10)

    if (position < 1 || position > options.length) {
      throw rowValidationError(
        `correctOption must be between 1 and ${options.length}`,
        'correctOption',
      )
    }

    correctIndex = position - 1
  } else {
    const matchingIndexes = options
      .map((option, index) => ({ index, text: option.text.trim().toLowerCase() }))
      .filter(({ text }) => text === normalizedSelector.toLowerCase())
      .map(({ index }) => index)

    if (matchingIndexes.length !== 1) {
      throw rowValidationError(
        'correctOption must be a 1-based option number or exactly match one option text',
        'correctOption',
      )
    }

    ;[correctIndex] = matchingIndexes
  }

  return options.map((option, index) => ({
    ...option,
    isCorrect: index === correctIndex,
  }))
}

function normalizeJsonOptions(rawOptions, correctOption) {
  let parsed

  try {
    parsed = JSON.parse(rawOptions)
  } catch {
    throw rowValidationError('options must contain a valid JSON array', 'options')
  }

  if (!Array.isArray(parsed)) {
    throw rowValidationError('options must contain a JSON array', 'options')
  }

  const options = parsed.map((option, index) => {
    if (typeof option === 'string') {
      return { isCorrect: false, order: index, text: option }
    }

    if (!option || typeof option !== 'object' || Array.isArray(option)) {
      throw rowValidationError(`options[${index}] must be text or an option object`, 'options')
    }

    const unsupportedField = Object.keys(option).find((field) => !QUESTION_OPTION_FIELDS.has(field))

    if (unsupportedField) {
      throw rowValidationError(
        `options[${index}].${unsupportedField} is not an allowed field`,
        `options[${index}].${unsupportedField}`,
      )
    }

    return {
      isCorrect: option.isCorrect,
      order: option.order ?? index,
      text: option.text,
    }
  })

  if (isPresent(correctOption)) {
    return selectCorrectOption(options, correctOption)
  }

  if (parsed.some((option) => typeof option === 'string')) {
    throw rowValidationError(
      'correctOption is required when options is a JSON array of text values',
      'correctOption',
    )
  }

  return options
}

function normalizeNumberedOptions(values, correctOption) {
  const populated = Object.entries(values)
    .map(([name, value]) => {
      const match = name.match(/^option(\d+)$/)
      return match && isPresent(value)
        ? { number: Number.parseInt(match[1], 10), text: value }
        : null
    })
    .filter(Boolean)
    .sort((left, right) => left.number - right.number)

  if (populated.length === 0) {
    return []
  }

  const hasGap = populated.some(({ number }, index) => number !== index + 1)

  if (hasGap) {
    throw rowValidationError(
      'Numbered option columns must be populated consecutively starting with option1',
      'options',
    )
  }

  const options = populated.map(({ text }, index) => ({
    isCorrect: false,
    order: index,
    text,
  }))

  return selectCorrectOption(options, correctOption)
}

function normalizeQuestionOptions(values) {
  const hasJsonOptions = isPresent(values.options)
  const hasNumberedOptions = Object.entries(values).some(
    ([name, value]) => /^option\d+$/.test(name) && isPresent(value),
  )

  if (hasJsonOptions && hasNumberedOptions) {
    throw rowValidationError(
      'Use either the options JSON column or numbered option columns, not both',
      'options',
    )
  }

  if (hasJsonOptions) {
    return normalizeJsonOptions(values.options, values.correctOption)
  }

  if (hasNumberedOptions) {
    return normalizeNumberedOptions(values, values.correctOption)
  }

  if (isPresent(values.correctOption)) {
    throw rowValidationError('correctOption requires options', 'correctOption')
  }

  return []
}

function resolveQuestionSubject(values, subjects) {
  const subjectCode = values.subjectCode?.trim()
  const subjectId = values.subjectId?.trim()

  if (subjectCode && subjectId) {
    throw rowValidationError('Provide subjectCode or subjectId, not both', 'subjectCode')
  }

  if (subjectCode) {
    const subject = subjects.byCode.get(subjectCode.toLowerCase())

    if (!subject) {
      throw new AppError(`Subject code ${subjectCode} was not found`, 404, 'SUBJECT_NOT_FOUND', {
        field: 'subjectCode',
      })
    }

    return subject.id
  }

  if (subjectId) {
    if (!subjects.byId.has(subjectId)) {
      throw new AppError('Subject not found', 404, 'SUBJECT_NOT_FOUND', {
        field: 'subjectId',
      })
    }

    return subjectId
  }

  throw rowValidationError('subjectCode or subjectId is required', 'subjectCode')
}

function toQuestionRequest(values, subjects) {
  return {
    content: values.content,
    correctAnswerText: isPresent(values.correctAnswerText) ? values.correctAnswerText : null,
    difficulty: values.difficulty,
    marks: toInteger(values.marks),
    options: normalizeQuestionOptions(values),
    subjectId: resolveQuestionSubject(values, subjects),
    type: values.type,
  }
}

function skippedRow(rowNumber, error) {
  if (!(error instanceof AppError) || error.statusCode >= 500) {
    throw error
  }

  return {
    code: error.code,
    reason: error.message,
    row: rowNumber,
  }
}

function createSummary(totalRows, createdCount, skippedRows, warningRows = []) {
  return {
    createdCount,
    skippedCount: skippedRows.length,
    skippedRows,
    totalRows,
    warningCount: warningRows.length,
    warningRows,
  }
}

function isEmailDeliveryError(error) {
  return (
    error instanceof AppError &&
    ['EMAIL_DELIVERY_FAILED', 'EMAIL_SERVICE_UNAVAILABLE'].includes(error.code)
  )
}

export async function bulkImportStudents({ actorId, rows }) {
  const skippedRows = []
  const warningRows = []
  let createdCount = 0

  for (const { rowNumber, values } of rows) {
    let student

    try {
      student = validateManagedUserCreate(values)

      await createManagedUser({
        ...student,
        actorId,
        role: Role.STUDENT,
      })
      createdCount += 1
    } catch (error) {
      if (student && isEmailDeliveryError(error)) {
        const persistedStudent = await prisma.user.findFirst({
          select: { id: true },
          where: { email: student.email, role: Role.STUDENT },
        })

        if (persistedStudent) {
          createdCount += 1
          warningRows.push({
            code: error.code,
            reason:
              'Student was created, but the password-setup email could not be delivered. Ask the student to use Forgot Password.',
            row: rowNumber,
          })
          continue
        }
      }

      skippedRows.push(skippedRow(rowNumber, error))
    }
  }

  return createSummary(rows.length, createdCount, skippedRows, warningRows)
}

export async function bulkImportQuestions({ rows, teacherId }) {
  const subjectRecords = await prisma.subject.findMany({
    select: { code: true, id: true },
  })
  const subjects = {
    byCode: new Map(subjectRecords.map((subject) => [subject.code.toLowerCase(), subject])),
    byId: new Map(subjectRecords.map((subject) => [subject.id, subject])),
  }
  const skippedRows = []
  let createdCount = 0

  for (const { rowNumber, values } of rows) {
    try {
      const question = validateQuestionCreate(toQuestionRequest(values, subjects))

      await createTeacherQuestion({ question, teacherId })
      createdCount += 1
    } catch (error) {
      skippedRows.push(skippedRow(rowNumber, error))
    }
  }

  return createSummary(rows.length, createdCount, skippedRows)
}
