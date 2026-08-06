import { formatStatus } from './studentFormatters.js'

const STATUS_CLASSES = {
  AUTO_SUBMITTED:
    'border-amber-500/35 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200',
  EVALUATED:
    'border-emerald-500/35 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200',
  FAIL: 'border-rose-500/35 bg-rose-50 text-rose-800 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-200',
  IN_PROGRESS:
    'border-sky-500/35 bg-sky-50 text-sky-800 dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-200',
  NOT_STARTED:
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-300',
  PASS: 'border-emerald-500/35 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200',
  PUBLISHED:
    'border-violet-500/35 bg-violet-50 text-violet-800 dark:border-violet-400/25 dark:bg-violet-500/10 dark:text-violet-200',
  SUBMITTED:
    'border-amber-500/35 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200',
}

export function StudentStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        STATUS_CLASSES[status] ?? STATUS_CLASSES.NOT_STARTED
      }`}
    >
      {formatStatus(status)}
    </span>
  )
}
