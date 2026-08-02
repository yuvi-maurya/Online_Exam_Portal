import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  TeacherCardSkeleton,
  TeacherPageHeader,
  TeacherPanel,
  TeacherQueryError,
  TeacherSummaryCard,
} from '../../components/teacher/shared/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { getTeacherExamReport, teacherQueryKeys } from '../../services/teacherApi.js'

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

function formatNumber(value) {
  const number = Number(value)
  return value !== null && value !== '' && Number.isFinite(number)
    ? numberFormatter.format(number)
    : '—'
}

function formatPercentage(value) {
  const formatted = formatNumber(value)
  return formatted === '—' ? formatted : `${formatted}%`
}

export function TeacherExamReportPage() {
  const { id } = useParams()
  const reportQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getTeacherExamReport(id),
    queryKey: teacherQueryKeys.examReport(id),
  })
  const report = reportQuery.data

  useDocumentTitle(report?.exam?.title ? `${report.exam.title} report` : 'Exam report')

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <TeacherPageHeader
        actions={
          <Link
            className="inline-flex rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
            to="/teacher/reports"
          >
            ← All reports
          </Link>
        }
        description="Performance calculations include fully evaluated attempts only; pending work remains visible as a separate count."
        eyebrow="Exam report"
        title={report?.exam?.title ?? 'Exam performance'}
      />

      {reportQuery.isPending ? <TeacherCardSkeleton count={3} /> : null}
      {reportQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(reportQuery.error, 'This exam report could not be loaded.')}
          onRetry={() => reportQuery.refetch()}
        />
      ) : null}

      {reportQuery.isSuccess ? (
        <>
          <section
            aria-label="Exam result summary"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <TeacherSummaryCard
              helper={`${formatNumber(report.summary.evaluatedCount)} evaluated · ${formatNumber(
                report.summary.pendingCount,
              )} pending`}
              label="Total attempts"
              value={formatNumber(report.summary.totalAttempts)}
            />
            <TeacherSummaryCard
              helper={`Out of ${formatNumber(report.exam.totalMarks)} marks`}
              label="Average score"
              value={formatNumber(report.summary.averageScore)}
            />
            <TeacherSummaryCard
              label="Average percentage"
              value={formatPercentage(report.summary.averagePercentage)}
            />
            <TeacherSummaryCard
              helper="Across evaluated attempts"
              label="Pass percentage"
              value={formatPercentage(report.summary.passPercentage)}
            />
            <TeacherSummaryCard
              helper="Completed and fully graded"
              label="Evaluated attempts"
              value={formatNumber(report.summary.evaluatedCount)}
            />
            <TeacherSummaryCard
              helper="In progress or awaiting grades"
              label="Pending attempts"
              value={formatNumber(report.summary.pendingCount)}
            />
          </section>

          <TeacherPanel
            description="Right and wrong totals make unusually difficult or easy questions easy to spot."
            title="Question analysis"
          >
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">Per-question exam performance</caption>
                <thead className="bg-slate-950/70 text-xs tracking-wide text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Question
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Type
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Right
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Wrong
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Analyzed
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Max marks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.questionAnalysis.length === 0 ? (
                    <tr className="border-t border-slate-800">
                      <td className="px-4 py-10 text-center text-slate-400" colSpan={6}>
                        Question analysis will appear after evaluated attempts are available.
                      </td>
                    </tr>
                  ) : (
                    report.questionAnalysis.map((question) => (
                      <tr
                        className="border-t border-slate-800 text-slate-300"
                        key={question.questionId}
                      >
                        <th className="max-w-xl px-4 py-4 font-medium text-white" scope="row">
                          <span className="mr-2 text-slate-500">#{question.order}</span>
                          {question.questionText}
                        </th>
                        <td className="px-4 py-4">{question.questionType.replaceAll('_', ' ')}</td>
                        <td className="px-4 py-4 text-emerald-300">
                          {formatNumber(question.correctCount)}
                        </td>
                        <td className="px-4 py-4 text-rose-300">
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
            description="Ties follow the evaluation engine's submitted-time ordering."
            title="Ranked student results"
          >
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">Ranked exam results</caption>
                <thead className="bg-slate-950/70 text-xs tracking-wide text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Rank
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Student
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Score
                    </th>
                    <th className="px-4 py-3 font-medium" scope="col">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.rankedResults.length === 0 ? (
                    <tr className="border-t border-slate-800">
                      <td className="px-4 py-10 text-center text-slate-400" colSpan={4}>
                        No evaluated student results are available yet.
                      </td>
                    </tr>
                  ) : (
                    report.rankedResults.map((result) => (
                      <tr
                        className="border-t border-slate-800 text-slate-300"
                        key={result.student.id}
                      >
                        <td className="px-4 py-4">
                          <span className="bg-brand-500/10 text-brand-400 inline-grid size-8 place-items-center rounded-full font-bold">
                            {formatNumber(result.rank)}
                          </span>
                        </td>
                        <th className="px-4 py-4 font-medium text-white" scope="row">
                          {result.student.name}
                        </th>
                        <td className="px-4 py-4">
                          {formatNumber(result.score)} / {formatNumber(report.exam.totalMarks)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-emerald-300">
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
        <p className="text-right text-xs text-slate-500" role="status">
          Refreshing report…
        </p>
      ) : null}
    </main>
  )
}
