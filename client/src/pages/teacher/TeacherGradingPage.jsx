import { useQueries, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PendingAnswerCard } from '../../components/teacher/grading/PendingAnswerCard.jsx'
import { TeacherPageHeader, TeacherQueryError } from '../../components/teacher/shared/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { getPendingGrading, listTeacherExams, teacherQueryKeys } from '../../services/teacherApi.js'

function GradingSkeleton() {
  const { t } = useTranslation()

  return (
    <div aria-busy="true" aria-label={t('teacher.grading.loading')} className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/55"
          key={index}
        />
      ))}
    </div>
  )
}

export function TeacherGradingPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('teacher.grading.title'))

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
  const queueIsLoading = examsQuery.isPending || pendingQueries.some((query) => query.isPending)
  const failedQueries = pendingQueries
    .map((query, index) => ({ exam: exams[index], query }))
    .filter(({ query }) => query.isError)
  const pendingAnswers = pendingQueries.flatMap((query, index) => {
    if (!query.data) {
      return []
    }

    const exam = exams[index]
    return (query.data.attempts ?? []).flatMap((attempt) =>
      (attempt.answers ?? [])
        .filter((answer) => answer.needsManualReview)
        .map((answer) => ({ answer, attempt, exam })),
    )
  })

  function retryFailedQueries() {
    failedQueries.forEach(({ query }) => query.refetch())
  }

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <TeacherPageHeader
        description={t('teacher.grading.description')}
        eyebrow={t('teacher.grading.eyebrow')}
        title={t('teacher.grading.title')}
      />

      {examsQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(examsQuery.error, t('teacher.dashboard.errors.exams'))}
          onRetry={() => examsQuery.refetch()}
        />
      ) : null}

      {failedQueries.length > 0 ? (
        <TeacherQueryError
          message={t('teacher.grading.errors.partial', { count: failedQueries.length })}
          onRetry={retryFailedQueries}
          title={t('teacher.grading.errors.partialTitle')}
        />
      ) : null}

      {queueIsLoading ? <GradingSkeleton /> : null}

      {!queueIsLoading &&
      !examsQuery.isError &&
      failedQueries.length === 0 &&
      pendingAnswers.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900/35">
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            {t('teacher.grading.emptyTitle')}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t('teacher.grading.emptyDescription')}
          </p>
        </section>
      ) : null}

      {pendingAnswers.length > 0 ? (
        <section aria-label={t('teacher.grading.queueAria')} className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('teacher.grading.pendingCount', { count: pendingAnswers.length })}
            </p>
          </div>
          {pendingAnswers.map(({ answer, attempt, exam }) => (
            <PendingAnswerCard
              answer={answer}
              attempt={attempt}
              exam={exam}
              key={`${attempt.id}:${answer.questionId}`}
            />
          ))}
        </section>
      ) : null}
    </main>
  )
}
