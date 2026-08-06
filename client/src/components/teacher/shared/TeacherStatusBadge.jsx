import { formatExamStatus } from './formatExamStatus.js'

const STATUS_CLASSES = {
  ARCHIVED:
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-300',
  COMPLETED:
    'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/10 dark:text-violet-200',
  DRAFT:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200',
  ONGOING:
    'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-200',
  PUBLISHED:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-200',
}

export function TeacherStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        STATUS_CLASSES[status] ?? STATUS_CLASSES.ARCHIVED
      }`}
    >
      {formatExamStatus(status)}
    </span>
  )
}
