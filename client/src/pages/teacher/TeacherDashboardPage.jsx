import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  TeacherCardSkeleton,
  TeacherPageHeader,
  TeacherPanel,
  TeacherQueryError,
  TeacherStatusBadge,
  TeacherSummaryCard,
  formatExamStatus,
} from '../../components/teacher/shared/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import {
  getPendingGrading,
  listTeacherExams,
  listTeacherQuestions,
  teacherQueryKeys,
} from '../../services/teacherApi.js'

const EXAM_STATUSES = ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'ARCHIVED']
const integerFormatter = new Intl.NumberFormat()

function formatInteger(value) {
  return Number.isFinite(Number(value)) ? integerFormatter.format(Number(value)) : '—'
}

export function TeacherDashboardPage() {
  useDocumentTitle('Teacher dashboard')

  const questionCountQuery = useQuery({
    queryFn: () => listTeacherQuestions({ limit: 1, page: 1 }),
    queryKey: teacherQueryKeys.questions({ limit: 1, page: 1 }),
  })
  const examsQuery = useQuery({
    queryFn: listTeacherExams,
    queryKey: teacherQueryKeys.exams,
  })
  const exams = examsQuery.data ?? []
  const pendingQueries = useQueries({
    queries: exams.map((exam) => ({
      queryFn: () => getPendingGrading(exam.id),
      queryKey: teacherQueryKeys.pendingGrading(exam.id),
    })),
  })

  const pendingQueriesLoading = pendingQueries.some((query) => query.isPending)
  const pendingQueriesWithErrors = pendingQueries.filter((query) => query.isError)
  const pendingAttemptCount = pendingQueries.reduce(
    (total, query) => total + (query.data?.attempts?.length ?? 0),
    0,
  )
  const questionCount = questionCountQuery.data?.pagination?.total
  const baseQueriesLoading = questionCountQuery.isPending || examsQuery.isPending
  const canShowMetrics = questionCountQuery.isSuccess && examsQuery.isSuccess
  const statusCounts = Object.fromEntries(
    EXAM_STATUSES.map((status) => [status, exams.filter((exam) => exam.status === status).length]),
  )

  function retryPendingQueries() {
    pendingQueriesWithErrors.forEach((query) => query.refetch())
  }

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <TeacherPageHeader
        description="Track your question bank, exam pipeline, and manual grading workload in one place."
        eyebrow="Overview"
        title="Teacher dashboard"
      />

      {baseQueriesLoading ? <TeacherCardSkeleton /> : null}
      {questionCountQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(
            questionCountQuery.error,
            'Your question count could not be loaded.',
          )}
          onRetry={() => questionCountQuery.refetch()}
        />
      ) : null}
      {examsQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(examsQuery.error, 'Your exams could not be loaded.')}
          onRetry={() => examsQuery.refetch()}
        />
      ) : null}

      {canShowMetrics ? (
        <section
          aria-label="Teacher workspace totals"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <TeacherSummaryCard
            helper="Questions you own across all subjects"
            label="Question bank"
            value={formatInteger(questionCount)}
          />
          <TeacherSummaryCard
            helper="Draft, scheduled, active, and archived"
            label="Total exams"
            value={formatInteger(exams.length)}
          />
          <TeacherSummaryCard
            action={
              <Link
                className="text-brand-400 inline-flex text-sm font-semibold transition hover:text-sky-300"
                to="/teacher/grading"
              >
                Open grading queue →
              </Link>
            }
            helper={
              pendingQueriesLoading
                ? 'Checking each exam for review work…'
                : 'Attempts with at least one answer awaiting a mark'
            }
            label="Pending grading"
            value={
              pendingQueriesLoading || pendingQueriesWithErrors.length > 0
                ? '—'
                : formatInteger(pendingAttemptCount)
            }
          />
        </section>
      ) : null}

      {pendingQueriesWithErrors.length > 0 ? (
        <TeacherQueryError
          message={`${pendingQueriesWithErrors.length} grading ${
            pendingQueriesWithErrors.length === 1 ? 'queue' : 'queues'
          } could not be checked. The pending total is hidden until all queues load.`}
          onRetry={retryPendingQueries}
          title="Some grading data is unavailable"
        />
      ) : null}

      {examsQuery.isSuccess ? (
        <TeacherPanel
          description="A snapshot of your exams at every stage of their lifecycle."
          title="Exams by status"
        >
          {exams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 px-5 py-10 text-center">
              <p className="text-sm text-slate-400">You have not created an exam yet.</p>
              <Link
                className="text-brand-400 mt-4 inline-flex text-sm font-semibold hover:text-sky-300"
                to="/teacher/exams"
              >
                Create your first exam
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {EXAM_STATUSES.map((status) => (
                <article
                  className="rounded-xl border border-slate-800 bg-slate-950/45 p-4"
                  key={status}
                >
                  <TeacherStatusBadge status={status} />
                  <p className="mt-4 text-2xl font-bold text-white">
                    {formatInteger(statusCounts[status])}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatExamStatus(status)} exams</p>
                </article>
              ))}
            </div>
          )}
        </TeacherPanel>
      ) : null}
    </main>
  )
}
