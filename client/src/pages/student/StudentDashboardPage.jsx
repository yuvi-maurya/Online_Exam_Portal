import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StudentExamCard } from '../../components/student/shell/StudentExamCard.jsx'
import { StudentPageHeader } from '../../components/student/shell/StudentPageHeader.jsx'
import {
  StudentEmptyState,
  StudentExamSkeleton,
  StudentQueryError,
} from '../../components/student/shell/StudentQueryState.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { getAvailableExams, startExam, studentQueryKeys } from '../../services/studentApi.js'

function getExamList(data) {
  if (Array.isArray(data)) {
    return data
  }

  return data?.exams ?? []
}

export function StudentDashboardPage() {
  useDocumentTitle('Student exams')

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [startError, setStartError] = useState('')
  const examsQuery = useQuery({
    queryFn: getAvailableExams,
    queryKey: studentQueryKeys.availableExams,
  })
  const startMutation = useMutation({
    mutationFn: startExam,
    onError: (error) => {
      setStartError(getApiErrorMessage(error, 'This exam could not be started. Please try again.'))
    },
    onMutate: () => {
      setStartError('')
    },
    onSuccess: async (data) => {
      const attempt = data?.attempt ?? data

      await queryClient.invalidateQueries({ queryKey: studentQueryKeys.availableExams })

      if (!attempt?.id) {
        setStartError(
          'The exam started, but the attempt could not be opened. Refresh and resume it.',
        )
        return
      }

      navigate(`/student/attempts/${attempt.id}`)
    },
  })
  const exams = getExamList(examsQuery.data)
  const inProgressCount = exams.filter((exam) => exam.attemptStatus === 'IN_PROGRESS').length
  const resultCount = exams.filter((exam) => exam.attemptStatus === 'EVALUATED').length

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <StudentPageHeader
        description="Start a scheduled exam, resume work in progress, or open a result when grading is complete."
        eyebrow="Exams"
        title="Your exam dashboard"
      />

      {examsQuery.isSuccess ? (
        <section aria-label="Exam status summary" className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <p className="text-xs font-medium text-slate-500">Listed exams</p>
            <p className="mt-2 text-2xl font-bold text-white">{exams.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <p className="text-xs font-medium text-slate-500">In progress</p>
            <p className="mt-2 text-2xl font-bold text-sky-200">{inProgressCount}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <p className="text-xs font-medium text-slate-500">Results ready</p>
            <p className="mt-2 text-2xl font-bold text-emerald-200">{resultCount}</p>
          </article>
        </section>
      ) : null}

      {startError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3" role="alert">
          <p className="text-sm text-rose-100">{startError}</p>
        </div>
      ) : null}

      {examsQuery.isPending ? <StudentExamSkeleton /> : null}
      {examsQuery.isError ? (
        <StudentQueryError
          message={getApiErrorMessage(
            examsQuery.error,
            'Your available exams could not be loaded.',
          )}
          onRetry={() => examsQuery.refetch()}
        />
      ) : null}
      {examsQuery.isSuccess && exams.length === 0 ? (
        <StudentEmptyState
          description="Published exams that are still open will appear here automatically."
          title="No exams are available right now"
        />
      ) : null}
      {examsQuery.isSuccess && exams.length > 0 ? (
        <section aria-label="Available exams" className="grid gap-4 xl:grid-cols-2">
          {exams.map((exam) => (
            <StudentExamCard
              exam={exam}
              isStarting={startMutation.isPending && startMutation.variables === exam.id}
              key={exam.id}
              onStart={startMutation.mutate}
            />
          ))}
        </section>
      ) : null}
    </main>
  )
}
