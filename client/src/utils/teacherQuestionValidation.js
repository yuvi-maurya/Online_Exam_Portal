export const QUESTION_TYPES = Object.freeze([
  { label: 'Multiple choice', value: 'MCQ' },
  { label: 'True / false', value: 'TRUE_FALSE' },
  { label: 'Fill in the blank', value: 'FILL_BLANK' },
  { label: 'Short answer', value: 'SHORT_ANSWER' },
  { label: 'Essay', value: 'ESSAY' },
  { label: 'Coding', value: 'CODING' },
])

export const QUESTION_DIFFICULTIES = Object.freeze([
  { label: 'Easy', value: 'EASY' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Hard', value: 'HARD' },
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
    return [createClientOption('True', true), createClientOption('False', false)]
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
    return 'Add the answer choices for this question.'
  }

  if (type === 'TRUE_FALSE' && options.length !== 2) {
    return 'True / false questions must have exactly two options.'
  }

  if (options.length < 2 || options.length > MAX_OPTIONS) {
    return `Questions must have between 2 and ${MAX_OPTIONS} options.`
  }

  const normalizedTexts = options.map((option) => option.text.trim().toLowerCase())

  if (normalizedTexts.some((text) => text.length === 0)) {
    return 'Every option needs an answer text.'
  }

  if (options.some((option) => option.text.trim().length > MAX_OPTION_LENGTH)) {
    return `Option text cannot exceed ${MAX_OPTION_LENGTH.toLocaleString()} characters.`
  }

  if (new Set(normalizedTexts).size !== normalizedTexts.length) {
    return 'Each option must have unique text.'
  }

  if (options.filter((option) => option.isCorrect).length !== 1) {
    return 'Mark exactly one option as correct.'
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
    errors.content = `Question text must be between 1 and ${MAX_CONTENT_LENGTH.toLocaleString()} characters.`
  }

  if (!supportedTypes.has(values.type)) {
    errors.type = 'Choose a valid question type.'
  }

  if (!supportedDifficulties.has(values.difficulty)) {
    errors.difficulty = 'Choose a valid difficulty.'
  }

  if (!subjectId || subjectId.length > MAX_SUBJECT_ID_LENGTH) {
    errors.subjectId = `Enter a subject ID of at most ${MAX_SUBJECT_ID_LENGTH} characters.`
  }

  if (!Number.isInteger(marks) || marks < 1 || marks > MAX_MARKS) {
    errors.marks = `Marks must be a whole number between 1 and ${MAX_MARKS.toLocaleString()}.`
  }

  if (CHOICE_QUESTION_TYPES.has(values.type)) {
    const optionsError = validateOptions(values.options, values.type)
    if (optionsError) errors.options = optionsError
  } else if (!correctAnswerText || correctAnswerText.length > MAX_CONTENT_LENGTH) {
    errors.correctAnswerText = `The correct answer must be between 1 and ${MAX_CONTENT_LENGTH.toLocaleString()} characters.`
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
