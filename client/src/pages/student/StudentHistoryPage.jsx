import { useQuery } from '@tanstack/react-query'
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
  useDocumentTitle('Exam history')

  const historyQuery = useQuery({
    queryFn: getExamHistory,
    queryKey: studentQueryKeys.examHistory,
  })
  const attempts = getAttempts(historyQuery.data)

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <StudentPageHeader
        description="Review submitted exams and open detailed feedback after evaluation is complete."
        eyebrow="Progress"
        title="Exam history"
      />

      {historyQuery.isPending ? <StudentExamSkeleton /> : null}
      {historyQuery.isError ? (
        <StudentQueryError
          message={getApiErrorMessage(historyQuery.error, 'Your exam history could not be loaded.')}
          onRetry={() => historyQuery.refetch()}
        />
      ) : null}
      {historyQuery.isSuccess && attempts.length === 0 ? (
        <StudentEmptyState
          description="An exam appears here after you submit it or its timer expires."
          title="No completed attempts yet"
        />
      ) : null}
      {historyQuery.isSuccess && attempts.length > 0 ? (
        <section aria-label="Past exam attempts" className="space-y-4">
          {attempts.map((attempt) => {
            const evaluated = attempt.status === 'EVALUATED'

            return (
              <article
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-slate-950/20"
                key={attempt.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
                      {attempt.exam?.subject?.name || 'Subject unavailable'}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-white">
                      {attempt.exam?.title || 'Exam'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Submitted {formatDateTime(attempt.submittedAt, 'submission time unavailable')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {attempt.result ? <StudentStatusBadge status={attempt.result} /> : null}
                    <StudentStatusBadge status={attempt.status} />
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-slate-500">Score</dt>
                    <dd className="mt-1 font-semibold text-slate-200">
                      {evaluated
                        ? `${formatNumber(attempt.score)} / ${formatNumber(attempt.exam?.totalMarks)}`
                        : 'Pending'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Percentage</dt>
                    <dd className="mt-1 font-semibold text-slate-200">
                      {evaluated ? formatPercentage(attempt.percentage) : 'Pending'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Rank</dt>
                    <dd className="mt-1 font-semibold text-slate-200">
                      {evaluated && attempt.rank ? `#${attempt.rank}` : 'Pending'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Time taken</dt>
                    <dd className="mt-1 font-semibold text-slate-200">
                      {formatSeconds(attempt.timeTakenSeconds)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex justify-end">
                  {evaluated ? (
                    <Link
                      className="inline-flex rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                      to={`/student/attempts/${attempt.id}/result`}
                    >
                      View detailed result
                    </Link>
                  ) : (
                    <p className="text-sm text-amber-200">Grading is still in progress.</p>
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
