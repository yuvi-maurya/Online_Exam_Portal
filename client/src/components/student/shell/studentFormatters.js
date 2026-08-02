const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

export function formatDateTime(value, fallback = 'Not scheduled') {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : dateTimeFormatter.format(date)
}

export function formatNumber(value, fallback = '—') {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? fallback
    : numberFormatter.format(Number(value))
}

export function formatPercentage(value, fallback = '—') {
  const formatted = formatNumber(value, fallback)
  return formatted === fallback ? fallback : `${formatted}%`
}

export function formatSeconds(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return '—'
  }

  const totalSeconds = Math.round(numericValue)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes < 1) {
    return `${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

export function formatStatus(value) {
  if (!value) {
    return 'Unknown'
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
