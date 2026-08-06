import i18n from '../i18n/index.js'

export const EXAM_TYPES = ['PRACTICE', 'MOCK', 'FINAL', 'QUIZ', 'DAILY', 'WEEKLY']

export const EXAM_STATUS_STYLES = Object.freeze({
  ARCHIVED:
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/45 dark:text-slate-300',
  COMPLETED:
    'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200',
  DRAFT:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  ONGOING:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  PUBLISHED:
    'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
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

function parseInteger(value, labelKey, { maximum, minimum }) {
  const number = Number(value)

  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    return {
      error: i18n.t('validation.exam.wholeNumberRange', {
        label: i18n.t(labelKey),
        maximum,
        minimum,
      }),
    }
  }

  return { value: number }
}

export function validateExamForm(values) {
  const title = values.title.trim()
  const subjectId = values.subjectId.trim()

  if (title.length < 3 || title.length > 200) {
    return { error: i18n.t('validation.exam.titleLength') }
  }

  if (!subjectId) {
    return { error: i18n.t('validation.common.subjectRequired') }
  }

  if (!EXAM_TYPES.includes(values.type)) {
    return { error: i18n.t('validation.exam.type') }
  }

  const duration = parseInteger(values.durationMinutes, 'exam.fields.duration', {
    maximum: 1440,
    minimum: 1,
  })
  if (duration.error) return duration

  const passingMarks = parseInteger(values.passingMarks, 'exam.fields.passingMarks', {
    maximum: 1_000_000,
    minimum: 0,
  })
  if (passingMarks.error) return passingMarks

  let tabSwitchLimit = null
  if (String(values.tabSwitchLimit).trim() !== '') {
    const limit = parseInteger(values.tabSwitchLimit, 'exam.fields.tabSwitchLimit', {
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
    return { error: i18n.t('validation.exam.startDate') }
  }

  if (!endValue || Number.isNaN(end.getTime())) {
    return { error: i18n.t('validation.exam.endDate') }
  }

  if (start.getTime() <= Date.now()) {
    return { error: i18n.t('validation.exam.startFuture') }
  }

  if (end.getTime() <= start.getTime()) {
    return { error: i18n.t('validation.exam.endAfterStart') }
  }

  return {
    payload: {
      scheduledEnd: end.toISOString(),
      scheduledStart: start.toISOString(),
    },
  }
}

export function formatDateTime(value) {
  if (!value) return i18n.t('common.notScheduled')

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? i18n.t('common.invalidDate')
    : date.toLocaleString(i18n.language)
}

export function toDateTimeLocal(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

export function formatExamType(value) {
  if (!value) return i18n.t('common.unknown')

  const typeKey = `exam.types.${value}`
  if (i18n.exists(typeKey)) return i18n.t(typeKey)

  const statusKey = `statuses.${value}`
  return i18n.exists(statusKey) ? i18n.t(statusKey) : i18n.t('common.unknown')
}
