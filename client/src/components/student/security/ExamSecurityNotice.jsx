const WARNING_STYLES = Object.freeze({
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
})

export function ExamSecurityNotice({
  detectionEnabled,
  onDismissWarning,
  remainingTabSwitches,
  tabSwitchCount,
  tabSwitchLimit,
  warning,
}) {
  if (!detectionEnabled && !warning) return null

  return (
    <section aria-label="Exam security status" className="space-y-3">
      {detectionEnabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/75 px-4 py-3 text-sm">
          <div>
            <p className="font-semibold text-slate-100">Security monitoring is active</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Switching away or leaving required full-screen mode is recorded.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-right">
            <p className="font-semibold text-white">
              {tabSwitchCount} / {tabSwitchLimit} recorded
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {remainingTabSwitches === 0
                ? 'No security events remaining'
                : `${remainingTabSwitches} ${
                    remainingTabSwitches === 1 ? 'security event' : 'security events'
                  } remaining`}
            </p>
          </div>
        </div>
      ) : null}

      {warning ? (
        <div
          aria-live="assertive"
          className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
            WARNING_STYLES[warning.tone] ?? WARNING_STYLES.warning
          }`}
          role="alert"
        >
          <p className="leading-6">{warning.message}</p>
          {onDismissWarning ? (
            <button
              aria-label="Dismiss security warning"
              className="shrink-0 rounded-md border border-current/25 px-2 py-1 text-xs font-semibold transition hover:bg-white/10"
              onClick={onDismissWarning}
              type="button"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
