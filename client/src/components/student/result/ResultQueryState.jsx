import { Link } from 'react-router-dom'

export function ResultLoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading exam result" className="space-y-6">
      <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55"
            key={index}
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55" />
    </div>
  )
}

export function ResultPendingState({ isChecking, message, onRetry }) {
  return (
    <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-6" role="status">
      <p className="text-xs font-semibold tracking-[0.16em] text-amber-300 uppercase">
        Evaluation pending
      </p>
      <h1 className="mt-2 text-2xl font-bold text-white">Your result is not ready yet</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-100/75">
        {message ||
          'Your exam was submitted successfully and may still be waiting for manual grading. Check again shortly.'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
          disabled={isChecking}
          onClick={onRetry}
          type="button"
        >
          {isChecking ? 'Checking…' : 'Check again'}
        </button>
        <Link
          className="rounded-xl border border-amber-300/30 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/10"
          to="/student/history"
        >
          View exam history
        </Link>
        <Link
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
          to="/student"
        >
          Back to exams
        </Link>
      </div>
    </section>
  )
}

export function ResultErrorState({ message, onRetry }) {
  return (
    <section className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6" role="alert">
      <p className="text-xs font-semibold tracking-[0.16em] text-rose-300 uppercase">
        Result unavailable
      </p>
      <h1 className="mt-2 text-2xl font-bold text-white">We could not load this result</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-100/75">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-xl border border-rose-300/30 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
        <Link
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
          to="/student/history"
        >
          Return to history
        </Link>
      </div>
    </section>
  )
}
