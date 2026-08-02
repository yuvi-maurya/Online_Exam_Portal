const STATUS_CONTENT = Object.freeze({
  idle: { className: 'text-slate-500', label: 'Not answered' },
  queued: { className: 'text-amber-300', label: 'Waiting to save\u2026' },
  retained: {
    className: 'text-amber-300',
    label: 'Saved answer retained; blank answers cannot replace it.',
  },
  retrying: { className: 'text-amber-300', label: 'Connection interrupted. Retrying\u2026' },
  saved: { className: 'text-emerald-300', label: 'Saved' },
  saving: { className: 'text-brand-400', label: 'Saving\u2026' },
})

export function AttemptSaveStatus({ onRetry, status }) {
  if (status.state === 'failed') {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs" role="alert">
        <span className="text-rose-300">{status.message ?? 'Answer not saved'}</span>
        <button
          className="rounded-md border border-rose-400/30 px-2 py-1 font-semibold text-rose-200 transition hover:bg-rose-500/10"
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      </div>
    )
  }

  const content = STATUS_CONTENT[status.state] ?? STATUS_CONTENT.idle
  return (
    <p aria-live="polite" className={`text-right text-xs font-medium ${content.className}`}>
      {content.label}
    </p>
  )
}
