import { useTranslation } from 'react-i18next'

const STATUS_CONTENT = Object.freeze({
  idle: { className: 'text-slate-500 dark:text-slate-400', labelKey: 'idle' },
  queued: { className: 'text-amber-700 dark:text-amber-300', labelKey: 'queued' },
  retained: {
    className: 'text-amber-700 dark:text-amber-300',
    labelKey: 'retained',
  },
  retrying: { className: 'text-amber-700 dark:text-amber-300', labelKey: 'retrying' },
  saved: { className: 'text-emerald-700 dark:text-emerald-300', labelKey: 'saved' },
  saving: { className: 'text-brand-600 dark:text-brand-400', labelKey: 'saving' },
})

export function AttemptSaveStatus({ onRetry, status }) {
  const { t } = useTranslation()

  if (status.state === 'failed') {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs" role="alert">
        <span className="text-rose-700 dark:text-rose-300">
          {status.message ?? t('student.attempt.saveStatus.answerNotSaved')}
        </span>
        <button
          className="rounded-md border border-rose-400/40 px-2 py-1 font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-200 dark:hover:bg-rose-500/10"
          onClick={onRetry}
          type="button"
        >
          {t('student.attempt.saveStatus.retry')}
        </button>
      </div>
    )
  }

  const content = STATUS_CONTENT[status.state] ?? STATUS_CONTENT.idle
  return (
    <p aria-live="polite" className={`text-right text-xs font-medium ${content.className}`}>
      {t(`student.attempt.saveStatus.${content.labelKey}`)}
    </p>
  )
}
