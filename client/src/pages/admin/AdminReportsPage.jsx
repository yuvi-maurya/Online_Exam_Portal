import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AdminPageHeader } from '../../components/admin/index.js'
import { ExportCsvButton } from '../../components/ExportCsvButton.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import i18n from '../../i18n/index.js'
import {
  adminQueryKeys,
  downloadAdminReportCsv,
  getSubjectWiseReport,
  getTopPerformers,
} from '../../services/adminApi.js'
import { getApiErrorMessage } from '../../services/apiClient.js'

const NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

function formatNumber(value) {
  return Number.isFinite(value) ? NUMBER_FORMATTER.format(value) : i18n.t('common.notAvailable')
}

function LoadingRows({ columns, rows = 4 }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={rowIndex} className="border-t border-slate-200 dark:border-slate-800">
      {Array.from({ length: columns }, (_, columnIndex) => (
        <td key={columnIndex} className="px-4 py-4">
          <span className="block h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </td>
      ))}
    </tr>
  ))
}

function TableMessage({ colSpan, message, onRetry, tone = 'muted' }) {
  const { t } = useTranslation()

  return (
    <tr className="border-t border-slate-200 dark:border-slate-800">
      <td
        className={
          tone === 'error'
            ? 'px-4 py-10 text-center text-sm text-rose-700 dark:text-rose-300'
            : 'px-4 py-10 text-center text-sm text-slate-600 dark:text-slate-400'
        }
        colSpan={colSpan}
      >
        <p>{message}</p>
        {onRetry ? (
          <button
            className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
            onClick={onRetry}
            type="button"
          >
            {t('common.tryAgain')}
          </button>
        ) : null}
      </td>
    </tr>
  )
}

function SubjectReportTable({ error, isLoading, onRetry, subjects }) {
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-950 dark:text-white">
          {t('admin.reports.subjectPerformance')}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t('admin.reports.subjectDescription')}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table aria-busy={isLoading} className="min-w-full text-left text-sm">
          <caption className="sr-only">{t('admin.reports.subjectCaption')}</caption>
          <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('common.subject')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('common.exams')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('common.evaluated')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('reports.averageScoreShort')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('reports.averagePercentageShort')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('reports.passRate')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <LoadingRows columns={6} /> : null}
            {error ? (
              <TableMessage
                colSpan={6}
                message={getApiErrorMessage(error, t('admin.reports.errors.subjects'))}
                onRetry={onRetry}
                tone="error"
              />
            ) : null}
            {!isLoading && !error && subjects.length === 0 ? (
              <TableMessage colSpan={6} message={t('admin.reports.emptySubjects')} />
            ) : null}
            {!isLoading && !error
              ? subjects.map((subject) => (
                  <tr
                    className="border-t border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                    key={subject.subjectId}
                  >
                    <th
                      className="px-4 py-4 font-medium text-slate-950 dark:text-white"
                      scope="row"
                    >
                      {subject.subjectName}
                      <span className="mt-1 block font-mono text-xs font-normal text-slate-500 dark:text-slate-400">
                        {subject.subjectCode}
                      </span>
                    </th>
                    <td className="px-4 py-4">{subject.totalExams}</td>
                    <td className="px-4 py-4">{subject.totalEvaluatedAttempts}</td>
                    <td className="px-4 py-4">{formatNumber(subject.averageScore)}</td>
                    <td className="px-4 py-4">{formatNumber(subject.averagePercentage)}%</td>
                    <td className="px-4 py-4">{formatNumber(subject.passPercentage)}%</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Leaderboard({ error, isLoading, onRetry, performers }) {
  const { t } = useTranslation()

  return (
    <section
      aria-busy={isLoading}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-950 dark:text-white">
          {t('admin.reports.topPerformers')}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t('admin.reports.topPerformersDescription')}
        </p>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div className="flex items-center gap-4 px-5 py-4" key={index}>
                <span className="size-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <span className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))
          : null}
        {error ? (
          <div
            className="px-5 py-10 text-center text-sm text-rose-700 dark:text-rose-300"
            role="alert"
          >
            <p>{getApiErrorMessage(error, t('admin.reports.errors.performers'))}</p>
            <button
              className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
              onClick={onRetry}
              type="button"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        ) : null}
        {!isLoading && !error && performers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">
            {t('admin.reports.emptyPerformers')}
          </p>
        ) : null}
        {!isLoading && !error
          ? performers.map((performer) => (
              <div className="flex items-center gap-4 px-5 py-4" key={performer.student.id}>
                <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
                  {performer.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-950 dark:text-white">
                    {performer.student.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('admin.reports.evaluatedAttemptCount', {
                      count: performer.attemptCount,
                    })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {formatNumber(performer.averagePercentage)}%
                </span>
              </div>
            ))
          : null}
      </div>
    </section>
  )
}

export function AdminReportsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('admin.reports.documentTitle'))

  const subjectReportQuery = useQuery({
    queryFn: getSubjectWiseReport,
    queryKey: adminQueryKeys.subjectReport,
  })
  const topPerformersQuery = useQuery({
    queryFn: getTopPerformers,
    queryKey: adminQueryKeys.topPerformers,
  })

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <ExportCsvButton
              filename="admin-overview-report.csv"
              getFile={() => downloadAdminReportCsv('overview')}
              label={t('admin.reports.exportOverview')}
            />
            <ExportCsvButton
              filename="admin-subject-wise-report.csv"
              getFile={() => downloadAdminReportCsv('subject-wise')}
              label={t('admin.reports.exportSubjects')}
            />
          </div>
        }
        description={t('admin.reports.description')}
        eyebrow={t('common.reports')}
        title={t('admin.reports.title')}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,1fr)]">
        <SubjectReportTable
          error={subjectReportQuery.error}
          isLoading={subjectReportQuery.isLoading}
          onRetry={() => subjectReportQuery.refetch()}
          subjects={subjectReportQuery.data ?? []}
        />
        <Leaderboard
          error={topPerformersQuery.error}
          isLoading={topPerformersQuery.isLoading}
          onRetry={() => topPerformersQuery.refetch()}
          performers={topPerformersQuery.data ?? []}
        />
      </div>
    </main>
  )
}
