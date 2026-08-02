import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StudentStatusBadge } from './StudentStatusBadge.jsx'
import { formatDateTime, formatStatus } from './studentFormatters.js'

function getStartState(exam, currentTime) {
  const scheduledStart = exam.scheduledStart ? new Date(exam.scheduledStart) : null

  if (
    scheduledStart &&
    !Number.isNaN(scheduledStart.getTime()) &&
    scheduledStart.getTime() > currentTime
  ) {
    return { canStart: false, label: `Opens ${formatDateTime(exam.scheduledStart)}` }
  }

  return { canStart: true, label: 'Start exam' }
}

function ExamAction({ exam, isStarting, onStart }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const attemptId = exam.attempt?.id

  useEffect(() => {
    const scheduledStart = Date.parse(exam.scheduledStart ?? '')
    if (!Number.isFinite(scheduledStart) || scheduledStart <= currentTime) return undefined

    const timeoutId = window.setTimeout(
      () => setCurrentTime(Date.now()),
      Math.min(scheduledStart - currentTime + 50, 60_000),
    )

    return () => window.clearTimeout(timeoutId)
  }, [currentTime, exam.scheduledStart])

  if (exam.attemptStatus === 'IN_PROGRESS' && attemptId) {
    return (
      <Link
        className="bg-brand-500 hover:bg-brand-400 focus:ring-brand-500/30 inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus:ring-4 focus:outline-none"
        to={`/student/attempts/${attemptId}`}
      >
        Resume exam
      </Link>
    )
  }

  if (exam.attemptStatus === 'EVALUATED' && attemptId) {
    return (
      <Link
        className="inline-flex justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
        to={`/student/attempts/${attemptId}/result`}
      >
        View result
      </Link>
    )
  }

  if (exam.attemptStatus === 'SUBMITTED' && attemptId) {
    return (
      <Link
        className="inline-flex justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
        to={`/student/attempts/${attemptId}/result`}
      >
        Check result
      </Link>
    )
  }

  const startState = getStartState(exam, currentTime)

  return (
    <button
      className="bg-brand-500 hover:bg-brand-400 focus:ring-brand-500/30 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
      disabled={!startState.canStart || isStarting}
      onClick={() => onStart(exam.id)}
      type="button"
    >
      {isStarting ? 'Starting…' : startState.label}
    </button>
  )
}

export function StudentExamCard({ exam, isStarting, onStart }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-slate-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
            {exam.subject?.code || 'Subject'}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{exam.title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {exam.subject?.name || 'Subject unavailable'}
          </p>
        </div>
        <StudentStatusBadge status={exam.attemptStatus} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Type</dt>
          <dd className="mt-1 font-medium text-slate-200">{formatStatus(exam.type)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Duration</dt>
          <dd className="mt-1 font-medium text-slate-200">{exam.durationMinutes} minutes</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Questions</dt>
          <dd className="mt-1 font-medium text-slate-200">{exam.questionCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Total marks</dt>
          <dd className="mt-1 font-medium text-slate-200">{exam.totalMarks}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm">
        <p className="text-xs text-slate-500">Schedule</p>
        <p className="mt-1 text-slate-300">
          {exam.scheduledStart
            ? `${formatDateTime(exam.scheduledStart)}${
                exam.scheduledEnd ? ` – ${formatDateTime(exam.scheduledEnd)}` : ''
              }`
            : 'Available now'}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Passing marks: <span className="font-semibold text-slate-300">{exam.passingMarks}</span>
        </p>
        <ExamAction exam={exam} isStarting={isStarting} onStart={onStart} />
      </div>
    </article>
  )
}
