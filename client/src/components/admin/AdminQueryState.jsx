import { useTranslation } from 'react-i18next'

export function AdminQueryError({ message, onRetry }) {
  const { t } = useTranslation()

  return (
    <div
      className="rounded-2xl border border-rose-300 bg-rose-50 p-5 dark:border-rose-500/25 dark:bg-rose-500/10"
      role="alert"
    >
      <p className="font-medium text-rose-800 dark:text-rose-100">{t('common.queryErrorTitle')}</p>
      <p className="mt-1 text-sm text-rose-700 dark:text-rose-200/75">{message}</p>
      {onRetry ? (
        <button
          className="mt-4 rounded-lg border border-rose-400 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/30 dark:text-rose-100 dark:hover:bg-rose-500/15"
          onClick={onRetry}
          type="button"
        >
          {t('common.tryAgain')}
        </button>
      ) : null}
    </div>
  )
}

export function AdminCardSkeleton({ count = 4 }) {
  const { t } = useTranslation()

  return (
    <div
      aria-busy="true"
      aria-label={t('admin.dashboard.loadingMetrics')}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/55"
          key={index}
        />
      ))}
    </div>
  )
}
