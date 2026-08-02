export function AdminQueryError({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5" role="alert">
      <p className="font-medium text-rose-100">Unable to load this data</p>
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

export function AdminCardSkeleton({ count = 4 }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading dashboard metrics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55"
          key={index}
        />
      ))}
    </div>
  )
}
