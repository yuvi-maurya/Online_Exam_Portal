import { useQueries, useQuery } from '@tanstack/react-query'
import { PendingAnswerCard } from '../../components/teacher/grading/PendingAnswerCard.jsx'
import { TeacherPageHeader, TeacherQueryError } from '../../components/teacher/shared/index.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { getPendingGrading, listTeacherExams, teacherQueryKeys } from '../../services/teacherApi.js'

function GradingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading grading queue" className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55"
          key={index}
        />
      ))}
    </div>
  )
}

export function TeacherGradingPage() {
  useDocumentTitle('Manual grading')

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
        description="Review open-ended student responses and award marks. Each saved answer leaves this queue immediately."
        eyebrow="Assessment"
        title="Manual grading"
      />

      {examsQuery.isError ? (
        <TeacherQueryError
          message={getApiErrorMessage(examsQuery.error, 'Your exams could not be loaded.')}
          onRetry={() => examsQuery.refetch()}
        />
      ) : null}

      {failedQueries.length > 0 ? (
        <TeacherQueryError
          message={`The grading queue could not be loaded for ${failedQueries.length} ${
            failedQueries.length === 1 ? 'exam' : 'exams'
          }. Available exams are still shown below.`}
          onRetry={retryFailedQueries}
          title="Part of the grading queue is unavailable"
        />
      ) : null}

      {queueIsLoading ? <GradingSkeleton /> : null}

      {!queueIsLoading &&
      !examsQuery.isError &&
      failedQueries.length === 0 &&
      pendingAnswers.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/35 px-5 py-14 text-center">
          <p className="text-lg font-semibold text-white">Your grading queue is clear</p>
          <p className="mt-2 text-sm text-slate-400">
            Answers that need manual review will appear here after students submit an exam.
          </p>
        </section>
      ) : null}

      {pendingAnswers.length > 0 ? (
        <section aria-label="Answers awaiting manual grading" className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-white">{pendingAnswers.length}</span>{' '}
              {pendingAnswers.length === 1 ? 'answer awaits' : 'answers await'} a mark
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
