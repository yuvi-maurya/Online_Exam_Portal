import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AdminCardSkeleton,
  AdminPageHeader,
  AdminPanel,
  AdminQueryError,
  AdminSummaryCard,
} from '../../components/admin/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import i18n from '../../i18n/index.js'
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
  return isNumericValue(value)
    ? integerFormatter.format(Number(value))
    : i18n.t('common.notAvailable')
}

function formatDecimal(value) {
  return isNumericValue(value)
    ? decimalFormatter.format(Number(value))
    : i18n.t('common.notAvailable')
}

function formatPercentage(value) {
  return isNumericValue(value)
    ? `${decimalFormatter.format(Number(value))}%`
    : i18n.t('common.notAvailable')
}

export function AdminDashboardPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('admin.dashboard.title'))

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
        description={t('admin.dashboard.description')}
        eyebrow={t('admin.dashboard.eyebrow')}
        title={t('admin.dashboard.title')}
      />

      <section aria-labelledby="portal-totals-heading" className="mt-8">
        <h2 className="sr-only" id="portal-totals-heading">
          {t('admin.dashboard.portalTotals')}
        </h2>
        {dashboardQuery.isPending ? <AdminCardSkeleton /> : null}
        {dashboardQuery.isError ? (
          <AdminQueryError
            message={getApiErrorMessage(dashboardQuery.error, t('admin.dashboard.errors.totals'))}
            onRetry={() => dashboardQuery.refetch()}
          />
        ) : null}
        {dashboardQuery.isSuccess ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminSummaryCard
              label={t('common.students')}
              value={formatInteger(dashboard?.totalStudents)}
            />
            <AdminSummaryCard
              label={t('common.teachers')}
              value={formatInteger(dashboard?.totalTeachers)}
            />
            <AdminSummaryCard
              label={t('common.subjects')}
              value={formatInteger(dashboard?.totalSubjects)}
            />
            <AdminSummaryCard
              label={t('common.exams')}
              value={formatInteger(dashboard?.totalExams)}
            />
          </div>
        ) : null}
      </section>

      <div className="mt-6">
        <AdminPanel
          description={t('admin.dashboard.performanceDescription')}
          title={t('admin.dashboard.performanceTitle')}
        >
          {overviewQuery.isPending ? <AdminCardSkeleton /> : null}
          {overviewQuery.isError ? (
            <AdminQueryError
              message={getApiErrorMessage(
                overviewQuery.error,
                t('admin.dashboard.errors.performance'),
              )}
              onRetry={() => overviewQuery.refetch()}
            />
          ) : null}
          {overviewQuery.isSuccess ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminSummaryCard
                helper={t('admin.dashboard.activeStudents', {
                  count: formatInteger(overview?.activeStudents),
                })}
                label={t('reports.averageScore')}
                value={formatDecimal(overview?.overallAverageScore)}
              />
              <AdminSummaryCard
                label={t('reports.averagePercentage')}
                value={formatPercentage(overview?.overallAveragePercentage)}
              />
              <AdminSummaryCard
                label={t('reports.passPercentage')}
                value={formatPercentage(overview?.overallPassPercentage)}
              />
              <AdminSummaryCard
                helper={t('admin.dashboard.evaluatedHelper')}
                label={t('reports.evaluatedAttempts')}
                value={formatInteger(overview?.totalEvaluatedAttempts)}
              />
            </div>
          ) : null}
        </AdminPanel>
      </div>
    </main>
  )
}
