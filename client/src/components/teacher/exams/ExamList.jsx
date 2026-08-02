import { Link } from 'react-router-dom'
import {
  EXAM_STATUS_STYLES,
  formatDateTime,
  formatExamType,
} from '../../../utils/teacherExamValidation.js'

function StatusBadge({ status }) {
  const style = EXAM_STATUS_STYLES[status] ?? 'border-slate-700 bg-slate-800 text-slate-300'

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      {formatExamType(status)}
    </span>
  )
}

export function ExamList({
  exams,
  hasFilters = false,
  mutationTarget,
  onArchive,
  onDelete,
  subjectLabelsById = new Map(),
}) {
  if (exams.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 px-5 py-12 text-center">
        <p className="font-medium text-slate-200">
          {hasFilters ? 'No matching exams' : 'No exams yet'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {hasFilters
            ? 'Adjust the search or status filter to see more exams.'
            : 'Create a draft, attach questions, and schedule it before publishing.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {exams.map((exam) => {
        const isMutating = mutationTarget === exam.id
        const canDelete = exam.status === 'DRAFT' && Number(exam.attemptCount ?? 0) === 0
        const canArchive = exam.status === 'PUBLISHED'

        return (
          <article
            className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/45 p-5"
            key={exam.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  {formatExamType(exam.type)}
                </p>
                <h3 className="mt-1 text-lg font-semibold break-words text-white">{exam.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Subject: {subjectLabelsById.get(exam.subjectId) ?? 'Unknown subject'}
                </p>
              </div>
              <StatusBadge status={exam.status} />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-slate-900/80 p-3">
                <dt className="text-xs text-slate-500">Questions</dt>
                <dd className="mt-1 font-semibold text-slate-100">{exam.questionCount ?? 0}</dd>
              </div>
              <div className="rounded-xl bg-slate-900/80 p-3">
                <dt className="text-xs text-slate-500">Attempts</dt>
                <dd className="mt-1 font-semibold text-slate-100">{exam.attemptCount ?? 0}</dd>
              </div>
              <div className="rounded-xl bg-slate-900/80 p-3">
                <dt className="text-xs text-slate-500">Total marks</dt>
                <dd className="mt-1 font-semibold text-slate-100">{exam.totalMarks ?? 0}</dd>
              </div>
              <div className="rounded-xl bg-slate-900/80 p-3">
                <dt className="text-xs text-slate-500">Duration</dt>
                <dd className="mt-1 font-semibold text-slate-100">{exam.durationMinutes} min</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-slate-800/80 px-3.5 py-3 text-xs leading-5 text-slate-400">
              <p>
                <span className="text-slate-500">Starts:</span>{' '}
                {formatDateTime(exam.scheduledStart)}
              </p>
              <p>
                <span className="text-slate-500">Ends:</span> {formatDateTime(exam.scheduledEnd)}
              </p>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Link
                className="bg-brand-500 hover:bg-brand-400 rounded-lg px-3 py-2 text-xs font-semibold text-white transition"
                to={`/teacher/exams/${exam.id}`}
              >
                {exam.status === 'DRAFT' ? 'Open builder' : 'View details'}
              </Link>
              <Link
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                to={`/teacher/exams/${exam.id}/report`}
              >
                View report
              </Link>
              {canArchive ? (
                <button
                  className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isMutating}
                  onClick={() => onArchive(exam)}
                  type="button"
                >
                  {isMutating ? 'Archiving…' : 'Archive'}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isMutating}
                  onClick={() => onDelete(exam)}
                  type="button"
                >
                  {isMutating ? 'Deleting…' : 'Delete draft'}
                </button>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
