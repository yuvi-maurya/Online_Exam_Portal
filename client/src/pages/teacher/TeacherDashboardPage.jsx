import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import i18n from '../../i18n/index.js'
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
  return Number.isFinite(Number(value))
    ? integerFormatter.format(Number(value))
    : i18n.t('common.notAvailable')
}

export function TeacherDashboardPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('teacher.dashboard.title'))

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
        description={t('teacher.dashboard.description')}
        eyebrow={t('teacher.dashboard.eyebrow')}
        title={t('teacher.dashboard.title')}
      />

      {baseQueriesLoading ? <TeacherCardSkeleton /> : null}
      {questionCountQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(
            questionCountQuery.error,
            t('teacher.dashboard.errors.questions'),
          )}
          onRetry={() => questionCountQuery.refetch()}
        />
      ) : null}
      {examsQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(examsQuery.error, t('teacher.dashboard.errors.exams'))}
          onRetry={() => examsQuery.refetch()}
        />
      ) : null}

      {canShowMetrics ? (
        <section
          aria-label={t('teacher.dashboard.totalsAria')}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <TeacherSummaryCard
            helper={t('teacher.dashboard.questionsHelper')}
            label={t('teacher.dashboard.questionBank')}
            value={formatInteger(questionCount)}
          />
          <TeacherSummaryCard
            helper={t('teacher.dashboard.examsHelper')}
            label={t('teacher.dashboard.totalExams')}
            value={formatInteger(exams.length)}
          />
          <TeacherSummaryCard
            action={
              <Link
                className="text-brand-700 hover:text-brand-600 dark:text-brand-400 inline-flex text-sm font-semibold transition dark:hover:text-sky-300"
                to="/teacher/grading"
              >
                {t('teacher.dashboard.openGrading')}
              </Link>
            }
            helper={
              pendingQueriesLoading
                ? t('teacher.dashboard.checkingGrading')
                : t('teacher.dashboard.pendingHelper')
            }
            label={t('teacher.dashboard.pendingGrading')}
            value={
              pendingQueriesLoading || pendingQueriesWithErrors.length > 0
                ? t('common.notAvailable')
                : formatInteger(pendingAttemptCount)
            }
          />
        </section>
      ) : null}

      {pendingQueriesWithErrors.length > 0 ? (
        <TeacherQueryError
          message={t('teacher.dashboard.errors.gradingQueues', {
            count: pendingQueriesWithErrors.length,
          })}
          onRetry={retryPendingQueries}
          title={t('teacher.dashboard.errors.gradingTitle')}
        />
      ) : null}

      {examsQuery.isSuccess ? (
        <TeacherPanel
          description={t('teacher.dashboard.statusDescription')}
          title={t('teacher.dashboard.statusTitle')}
        >
          {exams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('teacher.dashboard.noExams')}
              </p>
              <Link
                className="text-brand-700 hover:text-brand-600 dark:text-brand-400 mt-4 inline-flex text-sm font-semibold dark:hover:text-sky-300"
                to="/teacher/exams"
              >
                {t('teacher.dashboard.createFirstExam')}
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {EXAM_STATUSES.map((status) => (
                <article
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45"
                  key={status}
                >
                  <TeacherStatusBadge status={status} />
                  <p className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">
                    {formatInteger(statusCounts[status])}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('teacher.dashboard.statusExamCount', {
                      count: statusCounts[status],
                      status: formatExamStatus(status),
                    })}
                  </p>
                </article>
              ))}
            </div>
          )}
        </TeacherPanel>
      ) : null}
    </main>
  )
}
