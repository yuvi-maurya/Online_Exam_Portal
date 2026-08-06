import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  TeacherPageHeader,
  TeacherQueryError,
  TeacherRowsSkeleton,
  TeacherStatusBadge,
} from '../../components/teacher/shared/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import i18n from '../../i18n/index.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { listTeacherExams, teacherQueryKeys } from '../../services/teacherApi.js'

const integerFormatter = new Intl.NumberFormat()

function formatCount(value) {
  return Number.isFinite(Number(value))
    ? integerFormatter.format(Number(value))
    : i18n.t('common.notAvailable')
}

export function TeacherReportsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('teacher.reports.title'))

  const examsQuery = useQuery({
    queryFn: listTeacherExams,
    queryKey: teacherQueryKeys.exams,
  })
  const exams = examsQuery.data ?? []

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <TeacherPageHeader
        description={t('teacher.reports.description')}
        eyebrow={t('common.reports')}
        title={t('teacher.reports.title')}
      />

      {examsQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(examsQuery.error, t('teacher.dashboard.errors.exams'))}
          onRetry={() => examsQuery.refetch()}
        />
      ) : null}

      {!examsQuery.isError ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="font-semibold text-slate-950 dark:text-white">
              {t('teacher.exams.yourExams')}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t('teacher.reports.listDescription')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table aria-busy={examsQuery.isPending} className="min-w-full text-left text-sm">
              <caption className="sr-only">{t('teacher.reports.caption')}</caption>
              <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium" scope="col">
                    {t('common.exam')}
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    {t('common.status')}
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    {t('common.questions')}
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    {t('common.attempts')}
                  </th>
                  <th className="px-4 py-3 text-right font-medium" scope="col">
                    {t('common.report')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {examsQuery.isPending ? <TeacherRowsSkeleton columns={5} /> : null}
                {examsQuery.isSuccess && exams.length === 0 ? (
                  <tr className="border-t border-slate-200 dark:border-slate-800">
                    <td
                      className="px-4 py-12 text-center text-sm text-slate-600 dark:text-slate-400"
                      colSpan={5}
                    >
                      {t('teacher.reports.empty')}
                    </td>
                  </tr>
                ) : null}
                {examsQuery.isSuccess
                  ? exams.map((exam) => (
                      <tr
                        className="border-t border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                        key={exam.id}
                      >
                        <th
                          className="px-4 py-4 font-medium text-slate-950 dark:text-white"
                          scope="row"
                        >
                          {exam.title}
                          <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                            {t(`exam.types.${exam.type}`)}
                          </span>
                        </th>
                        <td className="px-4 py-4">
                          <TeacherStatusBadge status={exam.status} />
                        </td>
                        <td className="px-4 py-4">{formatCount(exam.questionCount)}</td>
                        <td className="px-4 py-4">{formatCount(exam.attemptCount)}</td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            className="text-brand-700 hover:text-brand-600 dark:text-brand-400 inline-flex rounded-lg border border-sky-300 px-3 py-2 text-xs font-semibold transition hover:bg-sky-50 dark:border-sky-400/25 dark:hover:bg-sky-500/10 dark:hover:text-sky-300"
                            to={`/teacher/exams/${exam.id}/report`}
                          >
                            {t('common.viewReport')}
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
