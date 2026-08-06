import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDateTime, formatExamType } from '../../../utils/teacherExamValidation.js'

const STATUS_STYLES = {
  ARCHIVED:
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/45 dark:text-slate-300',
  COMPLETED:
    'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200',
  DRAFT:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  ONGOING:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  PUBLISHED:
    'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
}

function StatusBadge({ status }) {
  const style =
    STATUS_STYLES[status] ??
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'

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
  const { t } = useTranslation()

  if (exams.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700">
        <p className="font-medium text-slate-950 dark:text-slate-200">
          {hasFilters ? t('teacher.exams.list.noMatches') : t('teacher.exams.list.empty')}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {hasFilters
            ? t('teacher.exams.list.noMatchesDescription')
            : t('teacher.exams.list.emptyDescription')}
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
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/45"
            key={exam.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
                  {formatExamType(exam.type)}
                </p>
                <h3 className="mt-1 text-lg font-semibold break-words text-slate-950 dark:text-white">
                  {exam.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('common.subject')}:{' '}
                  {subjectLabelsById.get(exam.subjectId) ?? t('common.unknownSubject')}
                </p>
              </div>
              <StatusBadge status={exam.status} />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-900/80">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t('common.questions')}
                </dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">
                  {exam.questionCount ?? 0}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-900/80">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t('common.attempts')}
                </dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">
                  {exam.attemptCount ?? 0}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-900/80">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t('common.totalMarks')}
                </dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">
                  {exam.totalMarks ?? 0}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-900/80">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t('exam.fields.duration')}
                </dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">
                  {t('common.minutesShort', { count: exam.durationMinutes })}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-slate-200 px-3.5 py-3 text-xs leading-5 text-slate-600 dark:border-slate-800/80 dark:text-slate-400">
              <p>
                <span className="text-slate-500 dark:text-slate-400">{t('common.starts')}:</span>{' '}
                {formatDateTime(exam.scheduledStart)}
              </p>
              <p>
                <span className="text-slate-500 dark:text-slate-400">{t('common.ends')}:</span>{' '}
                {formatDateTime(exam.scheduledEnd)}
              </p>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Link
                className="bg-brand-500 hover:bg-brand-400 rounded-lg px-3 py-2 text-xs font-semibold text-white transition"
                to={`/teacher/exams/${exam.id}`}
              >
                {exam.status === 'DRAFT'
                  ? t('teacher.exams.list.openBuilder')
                  : t('common.viewDetails')}
              </Link>
              <Link
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                to={`/teacher/exams/${exam.id}/report`}
              >
                {t('common.viewReport')}
              </Link>
              {canArchive ? (
                <button
                  className="rounded-lg border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-500/10"
                  disabled={isMutating}
                  onClick={() => onArchive(exam)}
                  type="button"
                >
                  {isMutating ? t('common.archiving') : t('common.archive')}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  className="rounded-lg border border-rose-400 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-200 dark:hover:bg-rose-500/10"
                  disabled={isMutating}
                  onClick={() => onDelete(exam)}
                  type="button"
                >
                  {isMutating ? t('common.deleting') : t('teacher.exams.list.deleteDraft')}
                </button>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
