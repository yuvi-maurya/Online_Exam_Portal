import { useTranslation } from 'react-i18next'

export function QuestionDeleteDialog({ error, isPending, onCancel, onConfirm, question }) {
  const { t } = useTranslation()

  if (!question) return null

  return (
    <div
      aria-labelledby="delete-question-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/20 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
        <p className="text-xs font-semibold tracking-[0.18em] text-rose-700 uppercase dark:text-rose-300">
          {t('teacher.questions.delete.eyebrow')}
        </p>
        <h2
          className="mt-2 text-xl font-semibold text-slate-950 dark:text-white"
          id="delete-question-title"
        >
          {t('teacher.questions.delete.title')}
        </h2>
        <p className="mt-3 line-clamp-3 leading-6 text-slate-600 dark:text-slate-400">
          “{question.content}”
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('teacher.questions.delete.description')}
        </p>

        {error ? (
          <div
            className="mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {t('common.cancel')}
          </button>
          <button
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {isPending
              ? t('teacher.questions.delete.deleting')
              : t('teacher.questions.delete.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
