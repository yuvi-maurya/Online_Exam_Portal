import { useTranslation } from 'react-i18next'

export function AttemptNavigator({
  answersByQuestion,
  currentQuestionId,
  getSaveStatus,
  onSelect,
  questions,
}) {
  const { t } = useTranslation()

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm lg:sticky lg:top-6 lg:self-start dark:border-slate-800 dark:bg-slate-900/55 dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-950 dark:text-white">
          {t('student.attempt.navigator.title')}
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('student.attempt.navigator.total', { count: questions.length })}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
        {questions.map((question, index) => {
          const isCurrent = currentQuestionId === question.id
          const isAnswered = answersByQuestion.get(question.id) === true
          const saveFailed = getSaveStatus(question.id).state === 'failed'
          const stateClass = saveFailed
            ? 'border-rose-500/50 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20 dark:bg-rose-500/15 dark:text-rose-100'
            : isCurrent
              ? 'border-brand-400 bg-brand-500 text-white ring-2 ring-brand-400/25'
              : isAnswered
                ? 'border-emerald-500/35 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'

          return (
            <button
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={t('student.attempt.navigator.questionAria', {
                number: index + 1,
                saveState: saveFailed ? t('student.attempt.navigator.saveFailedSuffix') : '',
                state: isAnswered
                  ? t('student.attempt.navigator.answered').toLowerCase()
                  : t('student.attempt.navigator.unanswered').toLowerCase(),
              })}
              className={`aspect-square rounded-lg border text-sm font-semibold transition ${stateClass}`}
              key={question.id}
              onClick={() => onSelect(question.id)}
              type="button"
            >
              {index + 1}
            </button>
          )
        })}
      </div>

      <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
          {t('student.attempt.navigator.answered')}
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" aria-hidden="true" />
          {t('student.attempt.navigator.unanswered')}
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />
          {t('student.attempt.navigator.saveNeedsRetry')}
        </p>
      </div>
    </aside>
  )
}
