const FAILURE_STATUSES = new Set(['denied', 'error', 'unavailable'])

export function WebcamPreview({ message, policyDecisionRequired, required, status, videoRef }) {
  if (!required) return null

  const hasFailure = FAILURE_STATUSES.has(status)

  return (
    <aside
      aria-label="Webcam presence preview"
      className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/90 shadow-lg shadow-black/20"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-3 py-2">
        <p className="text-xs font-semibold text-slate-200">Camera presence check</p>
        <span
          className={`inline-flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-wide uppercase ${
            status === 'active'
              ? 'text-emerald-300'
              : hasFailure
                ? 'text-amber-300'
                : 'text-slate-400'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'active'
                ? 'bg-emerald-400'
                : hasFailure
                  ? 'bg-amber-400'
                  : 'animate-pulse bg-slate-500'
            }`}
          />
          {status === 'active' ? 'Live' : hasFailure ? 'Attention' : 'Starting'}
        </span>
      </div>

      {!hasFailure ? (
        <div className="relative aspect-video bg-slate-950">
          <video
            aria-label="Live webcam preview; video is not recorded or uploaded"
            autoPlay
            className="h-full w-full [transform:scaleX(-1)] object-cover"
            muted
            playsInline
            ref={videoRef}
          />
          {status !== 'active' ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/75 text-xs text-slate-300">
              Requesting camera permission…
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="px-3 py-2.5">
        {message ? (
          <p className="text-xs leading-5 text-amber-100" role="alert">
            {message}
          </p>
        ) : (
          <p className="text-xs leading-5 text-slate-400">
            Preview only. Video is not recorded, analyzed, or uploaded.
          </p>
        )}
        {policyDecisionRequired ? (
          <p className="mt-2 text-xs font-semibold text-amber-300">
            Policy decision required; the client does not block the attempt automatically.
          </p>
        ) : null}
      </div>
    </aside>
  )
}
