import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function ResultLoadingState() {
  const { t } = useTranslation()

  return (
    <div aria-busy="true" aria-label={t('student.result.states.loadingAria')} className="space-y-6">
      <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900/55" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900/55"
            key={index}
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900/55" />
    </div>
  )
}

export function ResultPendingState({ isChecking, message, onRetry }) {
  const { t } = useTranslation()

  return (
    <section
      className="rounded-2xl border border-amber-500/35 bg-amber-50 p-6 dark:border-amber-400/25 dark:bg-amber-500/10"
      role="status"
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300">
        {t('student.result.states.pendingEyebrow')}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
        {t('student.result.states.pendingTitle')}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-800 dark:text-amber-100/75">
        {message || t('student.result.states.pendingDescription')}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
          disabled={isChecking}
          onClick={onRetry}
          type="button"
        >
          {isChecking ? t('student.result.states.checking') : t('student.result.states.checkAgain')}
        </button>
        <Link
          className="rounded-xl border border-amber-500/35 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-300/30 dark:text-amber-100 dark:hover:bg-amber-500/10"
          to="/student/history"
        >
          {t('student.result.states.viewHistory')}
        </Link>
        <Link
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          to="/student"
        >
          {t('student.result.states.backToExams')}
        </Link>
      </div>
    </section>
  )
}

export function ResultErrorState({ message, onRetry }) {
  const { t } = useTranslation()

  return (
    <section
      className="rounded-2xl border border-rose-500/35 bg-rose-50 p-6 dark:border-rose-500/25 dark:bg-rose-500/10"
      role="alert"
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-rose-700 uppercase dark:text-rose-300">
        {t('student.result.states.errorEyebrow')}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
        {t('student.result.states.errorTitle')}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-800 dark:text-rose-100/75">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-xl border border-rose-500/35 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-300/30 dark:text-rose-100 dark:hover:bg-rose-500/10"
          onClick={onRetry}
          type="button"
        >
          {t('student.result.states.tryAgain')}
        </button>
        <Link
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          to="/student/history"
        >
          {t('student.result.states.returnToHistory')}
        </Link>
      </div>
    </section>
  )
}
