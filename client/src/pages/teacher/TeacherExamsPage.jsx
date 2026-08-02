import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExamCreateForm } from '../../components/teacher/exams/ExamCreateForm.jsx'
import { ExamList } from '../../components/teacher/exams/ExamList.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import {
  archiveTeacherExam,
  createTeacherExam,
  deleteTeacherExam,
  listTeacherExams,
  listTeacherSubjects,
  teacherQueryKeys,
} from '../../services/teacherApi.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { formatExamType } from '../../utils/teacherExamValidation.js'
import { formatSubjectLabel } from '../../utils/teacherSubject.js'

const filterClassName =
  'rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15'

function QueryError({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5" role="alert">
      <p className="font-medium text-rose-100">Unable to load exams</p>
      <p className="mt-1 text-sm text-rose-200/75">{message}</p>
      <button
        className="mt-4 rounded-lg border border-rose-400/30 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  )
}

export function TeacherExamsPage() {
  useDocumentTitle('Teacher exams')

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const examsQuery = useQuery({
    queryFn: listTeacherExams,
    queryKey: teacherQueryKeys.exams,
  })
  const subjectsQuery = useQuery({
    queryFn: listTeacherSubjects,
    queryKey: teacherQueryKeys.subjects,
  })

  const createMutation = useMutation({
    mutationFn: createTeacherExam,
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Unable to create this exam.'))
    },
    onSuccess: async (exam) => {
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.exams })
      navigate(`/teacher/exams/${exam.id}`)
    },
  })

  const archiveMutation = useMutation({
    mutationFn: archiveTeacherExam,
    onError: (error) => {
      setActionError(getApiErrorMessage(error, 'Unable to archive this exam.'))
    },
    onSuccess: async (exam) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.exams }),
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.exam(exam.id) }),
      ])
      setNotice(`${exam.title} was archived.`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTeacherExam,
    onError: (error) => {
      setActionError(getApiErrorMessage(error, 'Unable to delete this draft.'))
    },
    onSuccess: async (exam) => {
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.exams })
      queryClient.removeQueries({ queryKey: teacherQueryKeys.exam(exam.id) })
      setNotice(`${exam.title} was deleted.`)
    },
  })

  const subjects = useMemo(
    () =>
      [...(subjectsQuery.data ?? [])].sort((left, right) =>
        formatSubjectLabel(left).localeCompare(formatSubjectLabel(right)),
      ),
    [subjectsQuery.data],
  )
  const subjectLabelsById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, formatSubjectLabel(subject)])),
    [subjects],
  )

  const exams = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return (examsQuery.data ?? []).filter((exam) => {
      if (status && exam.status !== status) return false
      if (!normalizedSearch) return true
      const subjectName = subjectLabelsById.get(exam.subjectId) ?? ''
      return (
        exam.title.toLowerCase().includes(normalizedSearch) ||
        subjectName.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [examsQuery.data, search, status, subjectLabelsById])

  const statusOptions = useMemo(
    () => [...new Set((examsQuery.data ?? []).map((exam) => exam.status))].sort(),
    [examsQuery.data],
  )

  const mutationTarget = archiveMutation.isPending
    ? archiveMutation.variables
    : deleteMutation.isPending
      ? deleteMutation.variables
      : null

  function startCreating() {
    createMutation.reset()
    setFormError('')
    setActionError('')
    setNotice('')
    setIsCreating(true)
  }

  function archiveExam(exam) {
    if (!window.confirm(`Archive “${exam.title}”? Students will no longer see it as available.`)) {
      return
    }

    setActionError('')
    setNotice('')
    archiveMutation.mutate(exam.id)
  }

  function deleteExam(exam) {
    if (!window.confirm(`Permanently delete the unused draft “${exam.title}”?`)) return

    setActionError('')
    setNotice('')
    deleteMutation.mutate(exam.id)
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
            Exam management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Exams</h1>
          <p className="mt-3 leading-7 text-slate-400">
            Build draft exams, configure security, schedule delivery, and publish when every
            requirement is ready.
          </p>
        </div>
        <button
          className="bg-brand-500 hover:bg-brand-400 shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={
            createMutation.isPending ||
            subjectsQuery.isPending ||
            subjectsQuery.isError ||
            !subjects.length
          }
          onClick={startCreating}
          type="button"
        >
          Create exam
        </button>
      </header>

      {notice ? (
        <div
          className="mt-7 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          role="status"
        >
          {notice}
        </div>
      ) : null}
      {actionError ? (
        <div
          className="mt-7 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {subjectsQuery.isError ? (
        <div
          className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          <span>
            {getApiErrorMessage(subjectsQuery.error, 'Unable to load the available subjects.')}
          </span>
          <button
            className="rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-semibold transition hover:bg-rose-500/15"
            onClick={() => subjectsQuery.refetch()}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : subjectsQuery.isSuccess && subjects.length === 0 ? (
        <p
          className="mt-7 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          No subjects are available yet. Ask an administrator to create one before adding an exam.
        </p>
      ) : null}

      {isCreating ? (
        <section className="mt-7 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Create an exam draft</h2>
            <p className="mt-1 text-sm text-slate-400">
              Scheduling and question attachment happen in the builder after the draft is saved.
            </p>
          </div>
          <ExamCreateForm
            error={formError}
            isPending={createMutation.isPending}
            onCancel={() => {
              if (!createMutation.isPending) setIsCreating(false)
            }}
            onClearError={() => setFormError('')}
            onSubmit={(payload) => createMutation.mutate(payload)}
            subjects={subjects}
            subjectsLoading={subjectsQuery.isPending}
            subjectsUnavailable={subjectsQuery.isError}
          />
        </section>
      ) : null}

      <section className="mt-7 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Your exams</h2>
            <p className="mt-1 text-sm text-slate-400">
              Counts and statuses are loaded from your teacher workspace.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_11rem]">
            <label className="text-xs font-medium text-slate-400">
              Search
              <input
                className={`mt-1.5 ${filterClassName}`}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Title or subject name"
                type="search"
                value={search}
              />
            </label>
            <label className="text-xs font-medium text-slate-400">
              Status
              <select
                className={`mt-1.5 ${filterClassName}`}
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatExamType(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5">
          {examsQuery.isPending ? (
            <div className="grid gap-4 xl:grid-cols-2" aria-label="Loading exams">
              {[0, 1].map((index) => (
                <div
                  className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/45"
                  key={index}
                />
              ))}
            </div>
          ) : examsQuery.isError ? (
            <QueryError
              message={getApiErrorMessage(examsQuery.error, 'Your exams could not be loaded.')}
              onRetry={() => examsQuery.refetch()}
            />
          ) : (
            <ExamList
              exams={exams}
              hasFilters={Boolean(search.trim() || status)}
              mutationTarget={mutationTarget}
              onArchive={archiveExam}
              onDelete={deleteExam}
              subjectLabelsById={subjectLabelsById}
            />
          )}
        </div>
      </section>
    </main>
  )
}
