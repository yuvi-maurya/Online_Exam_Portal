export const EXAM_TYPES = ['PRACTICE', 'MOCK', 'FINAL', 'QUIZ', 'DAILY', 'WEEKLY']

export const EXAM_STATUS_STYLES = Object.freeze({
  ARCHIVED: 'border-slate-600 bg-slate-700/45 text-slate-300',
  COMPLETED: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
  DRAFT: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  ONGOING: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  PUBLISHED: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
})

export const EMPTY_EXAM_FORM = Object.freeze({
  durationMinutes: '60',
  fullScreenRequired: true,
  passingMarks: '0',
  shuffleOptions: false,
  shuffleQuestions: false,
  subjectId: '',
  tabSwitchLimit: '',
  title: '',
  type: 'QUIZ',
  webcamMonitoring: false,
})

export function getExamFormValues(exam) {
  if (!exam) {
    return { ...EMPTY_EXAM_FORM }
  }

  return {
    durationMinutes: String(exam.durationMinutes),
    fullScreenRequired: Boolean(exam.fullScreenRequired),
    passingMarks: String(exam.passingMarks),
    shuffleOptions: Boolean(exam.shuffleOptions),
    shuffleQuestions: Boolean(exam.shuffleQuestions),
    subjectId: exam.subjectId ?? '',
    tabSwitchLimit:
      exam.tabSwitchLimit === null || exam.tabSwitchLimit === undefined
        ? ''
        : String(exam.tabSwitchLimit),
    title: exam.title ?? '',
    type: exam.type ?? 'QUIZ',
    webcamMonitoring: Boolean(exam.webcamMonitoring),
  }
}

function parseInteger(value, label, { maximum, minimum }) {
  const number = Number(value)

  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    return { error: `${label} must be a whole number from ${minimum} to ${maximum}.` }
  }

  return { value: number }
}

export function validateExamForm(values) {
  const title = values.title.trim()
  const subjectId = values.subjectId.trim()

  if (title.length < 3 || title.length > 200) {
    return { error: 'Title must contain between 3 and 200 characters.' }
  }

  if (!subjectId) {
    return { error: 'Choose a subject.' }
  }

  if (!EXAM_TYPES.includes(values.type)) {
    return { error: 'Choose a valid exam type.' }
  }

  const duration = parseInteger(values.durationMinutes, 'Duration', {
    maximum: 1440,
    minimum: 1,
  })
  if (duration.error) return duration

  const passingMarks = parseInteger(values.passingMarks, 'Passing marks', {
    maximum: 1_000_000,
    minimum: 0,
  })
  if (passingMarks.error) return passingMarks

  let tabSwitchLimit = null
  if (String(values.tabSwitchLimit).trim() !== '') {
    const limit = parseInteger(values.tabSwitchLimit, 'Tab-switch limit', {
      maximum: 10_000,
      minimum: 0,
    })
    if (limit.error) return limit
    tabSwitchLimit = limit.value
  }

  return {
    payload: {
      durationMinutes: duration.value,
      fullScreenRequired: values.fullScreenRequired,
      passingMarks: passingMarks.value,
      shuffleOptions: values.shuffleOptions,
      shuffleQuestions: values.shuffleQuestions,
      subjectId,
      tabSwitchLimit,
      title,
      type: values.type,
      webcamMonitoring: values.webcamMonitoring,
    },
  }
}

export function validateSchedule(startValue, endValue) {
  const start = new Date(startValue)
  const end = new Date(endValue)

  if (!startValue || Number.isNaN(start.getTime())) {
    return { error: 'Choose a valid start date and time.' }
  }

  if (!endValue || Number.isNaN(end.getTime())) {
    return { error: 'Choose a valid end date and time.' }
  }

  if (start.getTime() <= Date.now()) {
    return { error: 'The scheduled start must be in the future.' }
  }

  if (end.getTime() <= start.getTime()) {
    return { error: 'The scheduled end must be after the start.' }
  }

  return {
    payload: {
      scheduledEnd: end.toISOString(),
      scheduledStart: start.toISOString(),
    },
  }
}

export function formatDateTime(value) {
  if (!value) return 'Not scheduled'

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString()
}

export function toDateTimeLocal(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

export function formatExamType(value) {
  return value
    ? value
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Unknown'
}
