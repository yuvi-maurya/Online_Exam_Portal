export function QuestionDeleteDialog({ error, isPending, onCancel, onConfirm, question }) {
  if (!question) return null

  return (
    <div
      aria-labelledby="delete-question-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <p className="text-xs font-semibold tracking-[0.18em] text-rose-300 uppercase">
          Permanent action
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white" id="delete-question-title">
          Delete this question?
        </h2>
        <p className="mt-3 line-clamp-3 leading-6 text-slate-400">“{question.content}”</p>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This cannot be undone. Questions already used by exams or student answers are protected
          and cannot be deleted.
        </p>

        {error ? (
          <div
            className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {isPending ? 'Deleting question…' : 'Delete question'}
          </button>
        </div>
      </div>
    </div>
  )
}
