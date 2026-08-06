import { useTranslation } from 'react-i18next'

export function StudentQueryError({ message, onRetry, title }) {
  const { t } = useTranslation()
  const resolvedTitle = title ?? t('student.query.errorTitle')

  return (
    <div
      className="rounded-2xl border border-rose-500/35 bg-rose-50 p-5 dark:border-rose-500/25 dark:bg-rose-500/10"
      role="alert"
    >
      <p className="font-medium text-rose-900 dark:text-rose-100">{resolvedTitle}</p>
      <p className="mt-1 text-sm text-rose-700 dark:text-rose-200/75">{message}</p>
      {onRetry ? (
        <button
          className="mt-4 rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-400/30 dark:text-rose-100 dark:hover:bg-rose-500/15"
          onClick={onRetry}
          type="button"
        >
          {t('student.query.tryAgain')}
        </button>
      ) : null}
    </div>
  )
}

export function StudentExamSkeleton({ count = 3 }) {
  const { t } = useTranslation()

  return (
    <div
      aria-busy="true"
      aria-label={t('student.query.loadingExams')}
      className="grid gap-4 xl:grid-cols-2"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900/55"
          key={index}
        />
      ))}
    </div>
  )
}

export function StudentEmptyState({ description, title }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 px-5 py-12 text-center dark:border-slate-700 dark:bg-transparent">
      <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}
