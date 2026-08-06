import { useTranslation } from 'react-i18next'

const FAILURE_STATUSES = new Set(['denied', 'error', 'unavailable'])

export function WebcamPreview({ message, policyDecisionRequired, required, status, videoRef }) {
  const { t } = useTranslation()

  if (!required) return null

  const hasFailure = FAILURE_STATUSES.has(status)

  return (
    <aside
      aria-label={t('student.security.webcam.ariaLabel')}
      className="overflow-hidden rounded-xl border border-slate-300 bg-white/95 shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-black/20"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {t('student.security.webcam.title')}
        </p>
        <span
          className={`inline-flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-wide uppercase ${
            status === 'active'
              ? 'text-emerald-700 dark:text-emerald-300'
              : hasFailure
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-slate-600 dark:text-slate-400'
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
          {status === 'active'
            ? t('student.security.webcam.live')
            : hasFailure
              ? t('student.security.webcam.attention')
              : t('student.security.webcam.starting')}
        </span>
      </div>

      {!hasFailure ? (
        <div className="relative aspect-video bg-slate-950">
          <video
            aria-label={t('student.security.webcam.videoAria')}
            autoPlay
            className="h-full w-full [transform:scaleX(-1)] object-cover"
            muted
            playsInline
            ref={videoRef}
          />
          {status !== 'active' ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/75 text-xs text-slate-300">
              {t('student.security.webcam.requestingPermission')}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="px-3 py-2.5">
        {message ? (
          <p className="text-xs leading-5 text-amber-800 dark:text-amber-100" role="alert">
            {message}
          </p>
        ) : (
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
            {t('student.security.webcam.previewOnly')}
          </p>
        )}
        {policyDecisionRequired ? (
          <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t('student.security.webcam.policyDecision')}
          </p>
        ) : null}
      </div>
    </aside>
  )
}
