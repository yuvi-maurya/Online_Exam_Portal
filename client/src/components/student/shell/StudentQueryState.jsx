export function StudentQueryError({ message, onRetry, title = 'Unable to load this data' }) {
  return (
    <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5" role="alert">
      <p className="font-medium text-rose-100">{title}</p>
      <p className="mt-1 text-sm text-rose-200/75">{message}</p>
      {onRetry ? (
        <button
          className="mt-4 rounded-lg border border-rose-400/30 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function StudentExamSkeleton({ count = 3 }) {
  return (
    <div aria-busy="true" aria-label="Loading exams" className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <div
          className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55"
          key={index}
        />
      ))}
    </div>
  )
}

export function StudentEmptyState({ description, title }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 px-5 py-12 text-center">
      <p className="font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
    </div>
  )
}
