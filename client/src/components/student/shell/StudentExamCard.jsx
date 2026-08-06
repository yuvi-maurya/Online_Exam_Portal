import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StudentStatusBadge } from './StudentStatusBadge.jsx'
import { formatDateTime, formatStatus } from './studentFormatters.js'

function getStartState(exam, currentTime, t) {
  const scheduledStart = exam.scheduledStart ? new Date(exam.scheduledStart) : null

  if (
    scheduledStart &&
    !Number.isNaN(scheduledStart.getTime()) &&
    scheduledStart.getTime() > currentTime
  ) {
    return {
      canStart: false,
      label: t('student.exams.card.opens', { date: formatDateTime(exam.scheduledStart) }),
    }
  }

  return { canStart: true, label: t('student.exams.card.start') }
}

function ExamAction({ exam, isStarting, onStart }) {
  const { t } = useTranslation()
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
        {t('student.exams.card.resume')}
      </Link>
    )
  }

  if (exam.attemptStatus === 'EVALUATED' && attemptId) {
    return (
      <Link
        className="inline-flex justify-center rounded-xl border border-emerald-500/35 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
        to={`/student/attempts/${attemptId}/result`}
      >
        {t('student.exams.card.viewResult')}
      </Link>
    )
  }

  if (exam.attemptStatus === 'SUBMITTED' && attemptId) {
    return (
      <Link
        className="inline-flex justify-center rounded-xl border border-amber-500/35 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20"
        to={`/student/attempts/${attemptId}/result`}
      >
        {t('student.exams.card.checkResult')}
      </Link>
    )
  }

  const startState = getStartState(exam, currentTime, t)

  return (
    <button
      className="bg-brand-500 hover:bg-brand-400 focus:ring-brand-500/30 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      disabled={!startState.canStart || isStarting}
      onClick={() => onStart(exam.id)}
      type="button"
    >
      {isStarting ? t('student.exams.card.starting') : startState.label}
    </button>
  )
}

export function StudentExamCard({ exam, isStarting, onStart }) {
  const { t } = useTranslation()

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
            {exam.subject?.code || t('student.common.subject')}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
            {exam.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {exam.subject?.name || t('student.common.subjectUnavailable')}
          </p>
        </div>
        <StudentStatusBadge status={exam.attemptStatus} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            {t('student.exams.card.type')}
          </dt>
          <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">
            {formatStatus(exam.type)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            {t('student.exams.card.duration')}
          </dt>
          <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">
            {t('student.exams.card.minutes', { count: Number(exam.durationMinutes) })}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            {t('student.exams.card.questions')}
          </dt>
          <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">
            {exam.questionCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            {t('student.exams.card.totalMarks')}
          </dt>
          <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">{exam.totalMarks}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950/45">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('student.exams.card.schedule')}
        </p>
        <p className="mt-1 text-slate-700 dark:text-slate-300">
          {exam.scheduledStart
            ? `${formatDateTime(exam.scheduledStart)}${
                exam.scheduledEnd ? ` – ${formatDateTime(exam.scheduledEnd)}` : ''
              }`
            : t('student.exams.card.availableNow')}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('student.exams.card.passingMarks')}{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {exam.passingMarks}
          </span>
        </p>
        <ExamAction exam={exam} isStarting={isStarting} onStart={onStart} />
      </div>
    </article>
  )
}
