import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  TeacherPageHeader,
  TeacherQueryError,
  TeacherRowsSkeleton,
  TeacherStatusBadge,
} from '../../components/teacher/shared/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { listTeacherExams, teacherQueryKeys } from '../../services/teacherApi.js'

const integerFormatter = new Intl.NumberFormat()

function formatCount(value) {
  return Number.isFinite(Number(value)) ? integerFormatter.format(Number(value)) : '—'
}

export function TeacherReportsPage() {
  useDocumentTitle('Exam reports')

  const examsQuery = useQuery({
    queryFn: listTeacherExams,
    queryKey: teacherQueryKeys.exams,
  })
  const exams = examsQuery.data ?? []

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <TeacherPageHeader
        description="Open an exam to review participation, outcomes, question performance, and student rankings."
        eyebrow="Reports"
        title="Exam reports"
      />

      {examsQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(examsQuery.error, 'Your exams could not be loaded.')}
          onRetry={() => examsQuery.refetch()}
        />
      ) : null}

      {!examsQuery.isError ? (
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-white">Your exams</h2>
            <p className="mt-1 text-sm text-slate-400">
              Reports include only fully evaluated attempts in performance calculations.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table aria-busy={examsQuery.isPending} className="min-w-full text-left text-sm">
              <caption className="sr-only">Teacher exam report links</caption>
              <thead className="bg-slate-900 text-xs tracking-wide text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Exam
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Questions
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Attempts
                  </th>
                  <th className="px-4 py-3 text-right font-medium" scope="col">
                    Report
                  </th>
                </tr>
              </thead>
              <tbody>
                {examsQuery.isPending ? <TeacherRowsSkeleton columns={5} /> : null}
                {examsQuery.isSuccess && exams.length === 0 ? (
                  <tr className="border-t border-slate-800">
                    <td className="px-4 py-12 text-center text-sm text-slate-400" colSpan={5}>
                      No exams are available yet. Create an exam before opening its report.
                    </td>
                  </tr>
                ) : null}
                {examsQuery.isSuccess
                  ? exams.map((exam) => (
                      <tr className="border-t border-slate-800 text-slate-300" key={exam.id}>
                        <th className="px-4 py-4 font-medium text-white" scope="row">
                          {exam.title}
                          <span className="mt-1 block text-xs font-normal text-slate-500">
                            {exam.type.replaceAll('_', ' ')}
                          </span>
                        </th>
                        <td className="px-4 py-4">
                          <TeacherStatusBadge status={exam.status} />
                        </td>
                        <td className="px-4 py-4">{formatCount(exam.questionCount)}</td>
                        <td className="px-4 py-4">{formatCount(exam.attemptCount)}</td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            className="text-brand-400 inline-flex rounded-lg border border-sky-400/25 px-3 py-2 text-xs font-semibold transition hover:bg-sky-500/10 hover:text-sky-300"
                            to={`/teacher/exams/${exam.id}/report`}
                          >
                            View report
                          </Link>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  )
}
