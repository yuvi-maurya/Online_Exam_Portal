import { formatStatus } from './studentFormatters.js'

const STATUS_CLASSES = {
  AUTO_SUBMITTED: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  EVALUATED: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  FAIL: 'border-rose-400/25 bg-rose-500/10 text-rose-200',
  IN_PROGRESS: 'border-sky-400/25 bg-sky-500/10 text-sky-200',
  NOT_STARTED: 'border-slate-600 bg-slate-700/30 text-slate-300',
  PASS: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  PUBLISHED: 'border-violet-400/25 bg-violet-500/10 text-violet-200',
  SUBMITTED: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
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
