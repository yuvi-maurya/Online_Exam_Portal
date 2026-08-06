import i18n from '../../../i18n/index.js'

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

export function formatDateTime(value, fallback = i18n.t('common.notScheduled')) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : dateTimeFormatter.format(date)
}

export function formatNumber(value, fallback = i18n.t('student.common.notAvailable')) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? fallback
    : numberFormatter.format(Number(value))
}

export function formatPercentage(value, fallback = i18n.t('student.common.notAvailable')) {
  const formatted = formatNumber(value, fallback)
  return formatted === fallback ? fallback : `${formatted}%`
}

export function formatSeconds(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return i18n.t('student.common.notAvailable')
  }

  const totalSeconds = Math.round(numericValue)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes < 1) {
    return i18n.t('student.common.seconds', { count: seconds })
  }

  return i18n.t('student.common.minutesSeconds', { minutes, seconds })
}

export function formatStatus(value) {
  if (!value) {
    return i18n.t('student.common.unknown')
  }

  return i18n.t(`student.statuses.${value}`, {
    defaultValue: i18n.t('student.common.unknown'),
  })
}
