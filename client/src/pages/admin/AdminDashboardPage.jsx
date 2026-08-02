import { useQuery } from '@tanstack/react-query'
import {
  AdminCardSkeleton,
  AdminPageHeader,
  AdminPanel,
  AdminQueryError,
  AdminSummaryCard,
} from '../../components/admin/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { adminQueryKeys, getAdminDashboard, getAdminOverview } from '../../services/adminApi.js'
import { getApiErrorMessage } from '../../services/apiClient.js'

const integerFormatter = new Intl.NumberFormat()
const decimalFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

function isNumericValue(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
}

function formatInteger(value) {
  return isNumericValue(value) ? integerFormatter.format(Number(value)) : '—'
}

function formatDecimal(value) {
  return isNumericValue(value) ? decimalFormatter.format(Number(value)) : '—'
}

function formatPercentage(value) {
  return isNumericValue(value) ? `${decimalFormatter.format(Number(value))}%` : '—'
}

export function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard')

  const dashboardQuery = useQuery({
    queryFn: getAdminDashboard,
    queryKey: adminQueryKeys.dashboard,
  })
  const overviewQuery = useQuery({
    queryFn: getAdminOverview,
    queryKey: adminQueryKeys.overview,
  })

  const dashboard = dashboardQuery.data
  const overview = overviewQuery.data

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <AdminPageHeader
        description="A live view of accounts, subjects, exams, and evaluated performance across the portal."
        eyebrow="Overview"
        title="Admin dashboard"
      />

      <section aria-labelledby="portal-totals-heading" className="mt-8">
        <h2 className="sr-only" id="portal-totals-heading">
          Portal totals
        </h2>
        {dashboardQuery.isPending ? <AdminCardSkeleton /> : null}
        {dashboardQuery.isError ? (
          <AdminQueryError
            message={getApiErrorMessage(
              dashboardQuery.error,
              'Dashboard totals could not be loaded.',
            )}
            onRetry={() => dashboardQuery.refetch()}
          />
        ) : null}
        {dashboardQuery.isSuccess ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminSummaryCard label="Students" value={formatInteger(dashboard?.totalStudents)} />
            <AdminSummaryCard label="Teachers" value={formatInteger(dashboard?.totalTeachers)} />
            <AdminSummaryCard label="Subjects" value={formatInteger(dashboard?.totalSubjects)} />
            <AdminSummaryCard label="Exams" value={formatInteger(dashboard?.totalExams)} />
          </div>
        ) : null}
      </section>

      <div className="mt-6">
        <AdminPanel
          description="Only evaluated attempts are included in performance figures."
          title="Performance overview"
        >
          {overviewQuery.isPending ? <AdminCardSkeleton /> : null}
          {overviewQuery.isError ? (
            <AdminQueryError
              message={getApiErrorMessage(
                overviewQuery.error,
                'Performance overview could not be loaded.',
              )}
              onRetry={() => overviewQuery.refetch()}
            />
          ) : null}
          {overviewQuery.isSuccess ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminSummaryCard
                helper={`${formatInteger(overview?.activeStudents)} active students`}
                label="Average score"
                value={formatDecimal(overview?.overallAverageScore)}
              />
              <AdminSummaryCard
                label="Average percentage"
                value={formatPercentage(overview?.overallAveragePercentage)}
              />
              <AdminSummaryCard
                label="Pass percentage"
                value={formatPercentage(overview?.overallPassPercentage)}
              />
              <AdminSummaryCard
                helper="Completed and fully graded"
                label="Evaluated attempts"
                value={formatInteger(overview?.totalEvaluatedAttempts)}
              />
            </div>
          ) : null}
        </AdminPanel>
      </div>
    </main>
  )
}
