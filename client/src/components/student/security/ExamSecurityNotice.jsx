import { useTranslation } from 'react-i18next'

const WARNING_STYLES = Object.freeze({
  danger:
    'border-rose-500/40 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100',
  warning:
    'border-amber-500/40 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
})

export function ExamSecurityNotice({
  detectionEnabled,
  onDismissWarning,
  remainingTabSwitches,
  tabSwitchCount,
  tabSwitchLimit,
  warning,
}) {
  const { t } = useTranslation()

  if (!detectionEnabled && !warning) return null

  return (
    <section aria-label={t('student.security.notice.ariaLabel')} className="space-y-3">
      {detectionEnabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:shadow-none">
          <div>
            <p className="font-semibold text-slate-950 dark:text-slate-100">
              {t('student.security.notice.activeTitle')}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {t('student.security.notice.activeDescription')}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right dark:border-slate-700 dark:bg-slate-950/70">
            <p className="font-semibold text-slate-950 dark:text-white">
              {t('student.security.notice.recorded', {
                count: tabSwitchCount,
                limit: tabSwitchLimit,
              })}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {remainingTabSwitches === 0
                ? t('student.security.notice.noneRemaining')
                : t('student.security.notice.remaining', { count: remainingTabSwitches })}
            </p>
          </div>
        </div>
      ) : null}

      {warning ? (
        <div
          aria-live="assertive"
          className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
            WARNING_STYLES[warning.tone] ?? WARNING_STYLES.warning
          }`}
          role="alert"
        >
          <p className="leading-6">{warning.message}</p>
          {onDismissWarning ? (
            <button
              aria-label={t('student.security.notice.dismissAria')}
              className="shrink-0 rounded-md border border-current/25 px-2 py-1 text-xs font-semibold transition hover:bg-black/5 dark:hover:bg-white/10"
              onClick={onDismissWarning}
              type="button"
            >
              {t('student.security.notice.dismiss')}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
