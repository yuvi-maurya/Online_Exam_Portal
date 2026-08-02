export function FullscreenGuardOverlay({ error, isOpen, isRequesting, onEnterFullscreen }) {
  if (!isOpen) return null

  function keepFocusInsideGuard(event) {
    if (event.key === 'Tab' || event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return (
    <div
      aria-labelledby="fullscreen-guard-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/95 px-4 backdrop-blur-sm"
      onKeyDown={keepFocusInsideGuard}
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl border border-amber-400/30 bg-slate-900 p-6 text-center shadow-2xl shadow-black/50 sm:p-8">
        <div
          aria-hidden="true"
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-2xl text-amber-300"
        >
          ⛶
        </div>
        <h2
          className="mt-5 text-2xl font-bold tracking-tight text-white"
          id="fullscreen-guard-title"
        >
          Full-screen mode required
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Return to full-screen mode to continue your exam. Leaving full-screen during an active
          attempt is recorded as a security violation.
        </p>

        {error ? (
          <p
            className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-left text-sm text-rose-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          autoFocus
          className="bg-brand-600 hover:bg-brand-500 mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60"
          disabled={isRequesting}
          onClick={() => void onEnterFullscreen()}
          type="button"
        >
          {isRequesting ? 'Entering full-screen…' : 'Enter full-screen'}
        </button>
      </div>
    </div>
  )
}
