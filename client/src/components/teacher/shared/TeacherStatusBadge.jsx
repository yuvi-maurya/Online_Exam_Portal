import { formatExamStatus } from './formatExamStatus.js'

const STATUS_CLASSES = {
  ARCHIVED: 'border-slate-600 bg-slate-700/30 text-slate-300',
  COMPLETED: 'border-violet-400/25 bg-violet-500/10 text-violet-200',
  DRAFT: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  ONGOING: 'border-sky-400/25 bg-sky-500/10 text-sky-200',
  PUBLISHED: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
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
