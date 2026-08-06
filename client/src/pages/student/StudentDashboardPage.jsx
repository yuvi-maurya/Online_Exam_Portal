import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  useDocumentTitle(t('student.exams.dashboard.documentTitle'))

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
      setStartError(getApiErrorMessage(error, t('student.exams.dashboard.errors.start')))
    },
    onMutate: () => {
      setStartError('')
    },
    onSuccess: async (data) => {
      const attempt = data?.attempt ?? data

      await queryClient.invalidateQueries({ queryKey: studentQueryKeys.availableExams })

      if (!attempt?.id) {
        setStartError(t('student.exams.dashboard.errors.openAttempt'))
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
        description={t('student.exams.dashboard.description')}
        eyebrow={t('student.exams.dashboard.eyebrow')}
        title={t('student.exams.dashboard.title')}
      />

      {examsQuery.isSuccess ? (
        <section
          aria-label={t('student.exams.dashboard.summaryAria')}
          className="grid gap-3 sm:grid-cols-3"
        >
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/55 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('student.exams.dashboard.listedExams')}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{exams.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/55 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('student.exams.dashboard.inProgress')}
            </p>
            <p className="mt-2 text-2xl font-bold text-sky-700 dark:text-sky-200">
              {inProgressCount}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/55 dark:shadow-none">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('student.exams.dashboard.resultsReady')}
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-200">
              {resultCount}
            </p>
          </article>
        </section>
      ) : null}

      {startError ? (
        <div
          className="rounded-xl border border-rose-500/40 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10"
          role="alert"
        >
          <p className="text-sm text-rose-800 dark:text-rose-100">{startError}</p>
        </div>
      ) : null}

      {examsQuery.isPending ? <StudentExamSkeleton /> : null}
      {examsQuery.isError ? (
        <StudentQueryError
          message={getApiErrorMessage(examsQuery.error, t('student.exams.dashboard.errors.load'))}
          onRetry={() => examsQuery.refetch()}
        />
      ) : null}
      {examsQuery.isSuccess && exams.length === 0 ? (
        <StudentEmptyState
          description={t('student.exams.dashboard.emptyDescription')}
          title={t('student.exams.dashboard.emptyTitle')}
        />
      ) : null}
      {examsQuery.isSuccess && exams.length > 0 ? (
        <section
          aria-label={t('student.exams.dashboard.availableAria')}
          className="grid gap-4 xl:grid-cols-2"
        >
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
