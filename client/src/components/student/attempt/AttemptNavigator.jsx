export function AttemptNavigator({
  answersByQuestion,
  currentQuestionId,
  getSaveStatus,
  onSelect,
  questions,
}) {
  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-white">Questions</h2>
        <span className="text-xs text-slate-500">{questions.length} total</span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
        {questions.map((question, index) => {
          const isCurrent = currentQuestionId === question.id
          const isAnswered = answersByQuestion.get(question.id) === true
          const saveFailed = getSaveStatus(question.id).state === 'failed'
          const stateClass = saveFailed
            ? 'border-rose-500/50 bg-rose-500/15 text-rose-100 ring-2 ring-rose-500/20'
            : isCurrent
              ? 'border-brand-400 bg-brand-500 text-white ring-2 ring-brand-400/25'
              : isAnswered
                ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800'

          return (
            <button
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Question ${index + 1}, ${isAnswered ? 'answered' : 'unanswered'}${
                saveFailed ? ', save failed' : ''
              }`}
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

      <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Answered
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" aria-hidden="true" />
          Unanswered
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />
          Save needs retry
        </p>
      </div>
    </aside>
  )
}
