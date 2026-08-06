import i18n from '../i18n/index.js'

export const QUESTION_TYPES = Object.freeze([
  { labelKey: 'questions.types.MCQ', value: 'MCQ' },
  { labelKey: 'questions.types.TRUE_FALSE', value: 'TRUE_FALSE' },
  { labelKey: 'questions.types.FILL_BLANK', value: 'FILL_BLANK' },
  { labelKey: 'questions.types.SHORT_ANSWER', value: 'SHORT_ANSWER' },
  { labelKey: 'questions.types.ESSAY', value: 'ESSAY' },
  { labelKey: 'questions.types.CODING', value: 'CODING' },
])

export const QUESTION_DIFFICULTIES = Object.freeze([
  { labelKey: 'questions.difficulties.EASY', value: 'EASY' },
  { labelKey: 'questions.difficulties.MEDIUM', value: 'MEDIUM' },
  { labelKey: 'questions.difficulties.HARD', value: 'HARD' },
])

export const CHOICE_QUESTION_TYPES = new Set(['MCQ', 'TRUE_FALSE'])

const MAX_CONTENT_LENGTH = 20_000
const MAX_MARKS = 1_000_000
const MAX_OPTION_LENGTH = 2_000
const MAX_OPTIONS = 100
const MAX_SUBJECT_ID_LENGTH = 100

let optionSequence = 0

function createClientOption(text = '', isCorrect = false, id) {
  optionSequence += 1

  return {
    clientId: id ?? `question-option-${optionSequence}`,
    isCorrect,
    text,
  }
}

export function createDefaultChoiceOptions(type = 'MCQ') {
  if (type === 'TRUE_FALSE') {
    return [
      createClientOption(i18n.t('questions.options.true'), true),
      createClientOption(i18n.t('questions.options.false'), false),
    ]
  }

  return [createClientOption('', true), createClientOption('', false)]
}

export function getInitialQuestionValues(question) {
  const type = question?.type ?? 'MCQ'
  const isChoice = CHOICE_QUESTION_TYPES.has(type)
  const storedOptions = isChoice
    ? [...(question?.options ?? [])]
        .sort((left, right) => left.order - right.order)
        .map((option) => createClientOption(option.text, option.isCorrect, option.id))
    : []

  return {
    content: question?.content ?? '',
    correctAnswerText: question?.correctAnswerText ?? '',
    difficulty: question?.difficulty ?? 'MEDIUM',
    marks: question?.marks ? String(question.marks) : '1',
    options:
      isChoice && storedOptions.length > 0 ? storedOptions : createDefaultChoiceOptions(type),
    subjectId: question?.subjectId ?? '',
    type,
  }
}

function validateOptions(options, type) {
  if (!Array.isArray(options)) {
    return i18n.t('validation.question.optionsRequired')
  }

  if (type === 'TRUE_FALSE' && options.length !== 2) {
    return i18n.t('validation.question.trueFalseOptionCount')
  }

  if (options.length < 2 || options.length > MAX_OPTIONS) {
    return i18n.t('validation.question.optionCount', { maximum: MAX_OPTIONS })
  }

  const normalizedTexts = options.map((option) => option.text.trim().toLowerCase())

  if (normalizedTexts.some((text) => text.length === 0)) {
    return i18n.t('validation.question.optionTextRequired')
  }

  if (options.some((option) => option.text.trim().length > MAX_OPTION_LENGTH)) {
    return i18n.t('validation.question.optionTextMaximum', {
      maximum: MAX_OPTION_LENGTH.toLocaleString(i18n.language),
    })
  }

  if (new Set(normalizedTexts).size !== normalizedTexts.length) {
    return i18n.t('validation.question.optionUnique')
  }

  if (options.filter((option) => option.isCorrect).length !== 1) {
    return i18n.t('validation.question.oneCorrectOption')
  }

  return ''
}

export function validateQuestionValues(values) {
  const errors = {}
  const content = values.content.trim()
  const correctAnswerText = values.correctAnswerText.trim()
  const marks = Number(values.marks)
  const subjectId = values.subjectId.trim()
  const supportedTypes = new Set(QUESTION_TYPES.map(({ value }) => value))
  const supportedDifficulties = new Set(QUESTION_DIFFICULTIES.map(({ value }) => value))

  if (content.length < 1 || content.length > MAX_CONTENT_LENGTH) {
    errors.content = i18n.t('validation.question.contentLength', {
      maximum: MAX_CONTENT_LENGTH.toLocaleString(i18n.language),
    })
  }

  if (!supportedTypes.has(values.type)) {
    errors.type = i18n.t('validation.question.type')
  }

  if (!supportedDifficulties.has(values.difficulty)) {
    errors.difficulty = i18n.t('validation.question.difficulty')
  }

  if (!subjectId) {
    errors.subjectId = i18n.t('validation.common.subjectRequired')
  } else if (subjectId.length > MAX_SUBJECT_ID_LENGTH) {
    errors.subjectId = i18n.t('validation.common.subjectInvalid')
  }

  if (!Number.isInteger(marks) || marks < 1 || marks > MAX_MARKS) {
    errors.marks = i18n.t('validation.question.marks', {
      maximum: MAX_MARKS.toLocaleString(i18n.language),
    })
  }

  if (CHOICE_QUESTION_TYPES.has(values.type)) {
    const optionsError = validateOptions(values.options, values.type)
    if (optionsError) errors.options = optionsError
  } else if (!correctAnswerText || correctAnswerText.length > MAX_CONTENT_LENGTH) {
    errors.correctAnswerText = i18n.t('validation.question.correctAnswerLength', {
      maximum: MAX_CONTENT_LENGTH.toLocaleString(i18n.language),
    })
  }

  return errors
}

export function buildQuestionPayload(values) {
  const isChoice = CHOICE_QUESTION_TYPES.has(values.type)

  return {
    content: values.content.trim(),
    correctAnswerText: isChoice ? null : values.correctAnswerText.trim(),
    difficulty: values.difficulty,
    marks: Number(values.marks),
    options: isChoice
      ? values.options.map((option, order) => ({
          isCorrect: option.isCorrect,
          order,
          text: option.text.trim(),
        }))
      : [],
    subjectId: values.subjectId.trim(),
    type: values.type,
  }
}

export function addQuestionOption(options) {
  return [...options, createClientOption('', false)]
}

export function removeQuestionOption(options, clientId) {
  return options.filter((option) => option.clientId !== clientId)
}

export function moveQuestionOption(options, index, direction) {
  const nextIndex = index + direction

  if (nextIndex < 0 || nextIndex >= options.length) {
    return options
  }

  const reordered = [...options]
  const [option] = reordered.splice(index, 1)
  reordered.splice(nextIndex, 0, option)
  return reordered
}
