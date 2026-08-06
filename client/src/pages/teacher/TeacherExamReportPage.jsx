import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExportCsvButton } from '../../components/ExportCsvButton.jsx'
import {
  TeacherCardSkeleton,
  TeacherPageHeader,
  TeacherPanel,
  TeacherQueryError,
  TeacherSummaryCard,
} from '../../components/teacher/shared/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import i18n from '../../i18n/index.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import {
  downloadTeacherExamReportCsv,
  getTeacherExamReport,
  teacherQueryKeys,
} from '../../services/teacherApi.js'

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

function formatNumber(value) {
  const number = Number(value)
  return value !== null && value !== '' && Number.isFinite(number)
    ? numberFormatter.format(number)
    : i18n.t('common.notAvailable')
}

function formatPercentage(value) {
  const formatted = formatNumber(value)
  return formatted === i18n.t('common.notAvailable') ? formatted : `${formatted}%`
}

export function TeacherExamReportPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const reportQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getTeacherExamReport(id),
    queryKey: teacherQueryKeys.examReport(id),
  })
  const report = reportQuery.data

  useDocumentTitle(
    report?.exam?.title
      ? t('teacher.examReport.documentTitleWithExam', { title: report.exam.title })
      : t('teacher.examReport.documentTitle'),
  )

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <TeacherPageHeader
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              className="inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
              to="/teacher/reports"
            >
              {t('teacher.examReport.allReports')}
            </Link>
            <ExportCsvButton
              filename={`exam-${id}-report.csv`}
              getFile={() => downloadTeacherExamReportCsv(id)}
            />
          </div>
        }
        description={t('teacher.examReport.description')}
        eyebrow={t('teacher.examReport.documentTitle')}
        title={report?.exam?.title ?? t('teacher.examReport.performance')}
      />

      {reportQuery.isPending ? <TeacherCardSkeleton count={3} /> : null}
      {reportQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(reportQuery.error, t('teacher.examReport.errors.load'))}
          onRetry={() => reportQuery.refetch()}
        />
      ) : null}

      {reportQuery.isSuccess ? (
        <>
          <section
            aria-label={t('teacher.examReport.summaryAria')}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <TeacherSummaryCard
              helper={t('teacher.examReport.evaluatedPending', {
                evaluated: formatNumber(report.summary.evaluatedCount),
                pending: formatNumber(report.summary.pendingCount),
              })}
              label={t('teacher.examReport.totalAttempts')}
              value={formatNumber(report.summary.totalAttempts)}
            />
            <TeacherSummaryCard
              helper={t('teacher.examReport.outOfMarks', {
                marks: formatNumber(report.exam.totalMarks),
              })}
              label={t('reports.averageScore')}
              value={formatNumber(report.summary.averageScore)}
            />
            <TeacherSummaryCard
              label={t('reports.averagePercentage')}
              value={formatPercentage(report.summary.averagePercentage)}
            />
            <TeacherSummaryCard
              helper={t('teacher.examReport.acrossEvaluated')}
              label={t('reports.passPercentage')}
              value={formatPercentage(report.summary.passPercentage)}
            />
            <TeacherSummaryCard
              helper={t('admin.dashboard.evaluatedHelper')}
              label={t('reports.evaluatedAttempts')}
              value={formatNumber(report.summary.evaluatedCount)}
            />
            <TeacherSummaryCard
              helper={t('teacher.examReport.pendingHelper')}
              label={t('teacher.examReport.pendingAttempts')}
              value={formatNumber(report.summary.pendingCount)}
            />
          </section>

          <TeacherPanel
            description={t('teacher.examReport.questionAnalysisDescription')}
            title={t('teacher.examReport.questionAnalysis')}
          >
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">{t('teacher.examReport.questionCaption')}</caption>
                <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:bg-slate-950/70 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('common.question')}
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('common.type')}
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('teacher.examReport.right')}
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('teacher.examReport.wrong')}
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('teacher.examReport.analyzed')}
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('teacher.examReport.maxMarks')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.questionAnalysis.length === 0 ? (
                    <tr className="border-t border-slate-200 dark:border-slate-800">
                      <td
                        className="px-4 py-10 text-center text-slate-600 dark:text-slate-400"
                        colSpan={6}
                      >
                        {t('teacher.examReport.emptyQuestions')}
                      </td>
                    </tr>
                  ) : (
                    report.questionAnalysis.map((question) => (
                      <tr
                        className="border-t border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                        key={question.questionId}
                      >
                        <th
                          className="max-w-xl px-4 py-4 font-medium text-slate-950 dark:text-white"
                          scope="row"
                        >
                          <span className="mr-2 text-slate-500 dark:text-slate-400">
                            #{question.order}
                          </span>
                          {question.questionText}
                        </th>
                        <td className="px-4 py-4">
                          {t(`questions.types.${question.questionType}`)}
                        </td>
                        <td className="px-4 py-4 text-emerald-700 dark:text-emerald-300">
                          {formatNumber(question.correctCount)}
                        </td>
                        <td className="px-4 py-4 text-rose-700 dark:text-rose-300">
                          {formatNumber(question.incorrectCount)}
                        </td>
                        <td className="px-4 py-4">{formatNumber(question.attemptsAnalyzed)}</td>
                        <td className="px-4 py-4">{formatNumber(question.maxMarks)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TeacherPanel>

          <TeacherPanel
            description={t('teacher.examReport.rankDescription')}
            title={t('teacher.examReport.rankTitle')}
          >
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">{t('teacher.examReport.rankCaption')}</caption>
                <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:bg-slate-950/70 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('common.rank')}
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('roles.STUDENT')}
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('common.score')}
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      {t('common.percentage')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.rankedResults.length === 0 ? (
                    <tr className="border-t border-slate-200 dark:border-slate-800">
                      <td
                        className="px-4 py-10 text-center text-slate-600 dark:text-slate-400"
                        colSpan={4}
                      >
                        {t('teacher.examReport.emptyResults')}
                      </td>
                    </tr>
                  ) : (
                    report.rankedResults.map((result) => (
                      <tr
                        className="border-t border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                        key={result.student.id}
                      >
                        <td className="px-4 py-4">
                          <span className="bg-brand-500/10 text-brand-700 dark:text-brand-400 inline-grid size-8 place-items-center rounded-full font-bold">
                            {formatNumber(result.rank)}
                          </span>
                        </td>
                        <th
                          className="px-4 py-4 font-medium text-slate-950 dark:text-white"
                          scope="row"
                        >
                          {result.student.name}
                        </th>
                        <td className="px-4 py-4">
                          {formatNumber(result.score)} / {formatNumber(report.exam.totalMarks)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-emerald-700 dark:text-emerald-300">
                          {formatPercentage(result.percentage)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TeacherPanel>
        </>
      ) : null}

      {reportQuery.isFetching && !reportQuery.isPending ? (
        <p className="text-right text-xs text-slate-500 dark:text-slate-400" role="status">
          {t('teacher.examReport.refreshing')}
        </p>
      ) : null}
    </main>
  )
}
