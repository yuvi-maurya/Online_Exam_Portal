import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StudentPageHeader } from '../../components/student/shell/StudentPageHeader.jsx'
import {
  StudentEmptyState,
  StudentExamSkeleton,
  StudentQueryError,
} from '../../components/student/shell/StudentQueryState.jsx'
import { StudentStatusBadge } from '../../components/student/shell/StudentStatusBadge.jsx'
import {
  formatDateTime,
  formatNumber,
  formatPercentage,
  formatSeconds,
} from '../../components/student/shell/studentFormatters.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { getExamHistory, studentQueryKeys } from '../../services/studentApi.js'

function getAttempts(data) {
  if (Array.isArray(data)) {
    return data
  }

  return data?.attempts ?? []
}

export function StudentHistoryPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('student.history.documentTitle'))

  const historyQuery = useQuery({
    queryFn: getExamHistory,
    queryKey: studentQueryKeys.examHistory,
  })
  const attempts = getAttempts(historyQuery.data)

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <StudentPageHeader
        description={t('student.history.description')}
        eyebrow={t('student.history.eyebrow')}
        title={t('student.history.title')}
      />

      {historyQuery.isPending ? <StudentExamSkeleton /> : null}
      {historyQuery.isError ? (
        <StudentQueryError
          message={getApiErrorMessage(historyQuery.error, t('student.history.errors.load'))}
          onRetry={() => historyQuery.refetch()}
        />
      ) : null}
      {historyQuery.isSuccess && attempts.length === 0 ? (
        <StudentEmptyState
          description={t('student.history.emptyDescription')}
          title={t('student.history.emptyTitle')}
        />
      ) : null}
      {historyQuery.isSuccess && attempts.length > 0 ? (
        <section aria-label={t('student.history.attemptsAria')} className="space-y-4">
          {attempts.map((attempt) => {
            const evaluated = attempt.status === 'EVALUATED'

            return (
              <article
                className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/20"
                key={attempt.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                      {attempt.exam?.subject?.name || t('student.common.subjectUnavailable')}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                      {attempt.exam?.title || t('student.common.exam')}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {t('student.history.submitted', {
                        date: formatDateTime(
                          attempt.submittedAt,
                          t('student.history.submissionUnavailable'),
                        ),
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {attempt.result ? <StudentStatusBadge status={attempt.result} /> : null}
                    <StudentStatusBadge status={attempt.status} />
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">
                      {t('student.history.score')}
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                      {evaluated
                        ? `${formatNumber(attempt.score)} / ${formatNumber(attempt.exam?.totalMarks)}`
                        : t('student.common.pending')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">
                      {t('student.history.percentage')}
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                      {evaluated
                        ? formatPercentage(attempt.percentage)
                        : t('student.common.pending')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">
                      {t('student.history.rank')}
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                      {evaluated && attempt.rank
                        ? t('student.history.rankValue', { rank: attempt.rank })
                        : t('student.common.pending')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">
                      {t('student.history.timeTaken')}
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                      {formatSeconds(attempt.timeTakenSeconds)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex justify-end">
                  {evaluated ? (
                    <Link
                      className="inline-flex rounded-xl border border-emerald-500/35 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
                      to={`/student/attempts/${attempt.id}/result`}
                    >
                      {t('student.history.viewDetailedResult')}
                    </Link>
                  ) : (
                    <p className="text-sm text-amber-700 dark:text-amber-200">
                      {t('student.history.gradingInProgress')}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      ) : null}
    </main>
  )
}
