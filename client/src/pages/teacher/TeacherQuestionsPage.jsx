import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { QuestionDeleteDialog } from '../../components/teacher/questions/QuestionDeleteDialog.jsx'
import { QuestionFilters } from '../../components/teacher/questions/QuestionFilters.jsx'
import { QuestionForm } from '../../components/teacher/questions/QuestionForm.jsx'
import { QuestionTable } from '../../components/teacher/questions/QuestionTable.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { ApiError, getApiErrorMessage } from '../../services/apiClient.js'
import {
  createTeacherQuestion,
  deleteTeacherQuestion,
  listTeacherQuestions,
  listTeacherSubjects,
  teacherQueryKeys,
  updateTeacherQuestion,
} from '../../services/teacherApi.js'
import { formatSubjectLabel } from '../../utils/teacherSubject.js'

const PAGE_SIZE = 10
const SEARCH_FETCH_SIZE = 100
const EMPTY_FILTERS = Object.freeze({
  difficulty: '',
  search: '',
  subjectId: '',
  type: '',
})

async function fetchAllFilteredQuestions(filters) {
  const requestFilters = {
    difficulty: filters.difficulty,
    limit: SEARCH_FETCH_SIZE,
    page: 1,
    subjectId: filters.subjectId,
    type: filters.type,
  }
  const firstPage = await listTeacherQuestions(requestFilters)

  if (firstPage.pagination.totalPages <= 1) {
    return firstPage
  }

  const remainingPages = []

  for (let pageStart = 2; pageStart <= firstPage.pagination.totalPages; pageStart += 4) {
    const pageNumbers = Array.from(
      { length: Math.min(4, firstPage.pagination.totalPages - pageStart + 1) },
      (_, index) => pageStart + index,
    )
    const pageBatch = await Promise.all(
      pageNumbers.map((page) => listTeacherQuestions({ ...requestFilters, page })),
    )
    remainingPages.push(...pageBatch)
  }

  return {
    pagination: firstPage.pagination,
    questions: [...firstPage.questions, ...remainingPages.flatMap((result) => result.questions)],
  }
}

function getDeleteErrorMessage(error) {
  if (error instanceof ApiError && error.code === 'QUESTION_HAS_DEPENDENCIES') {
    return "Can't delete — this question is attached to an exam or has student responses."
  }

  return getApiErrorMessage(error, 'Unable to delete this question.')
}

function QueryError({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-5" role="alert">
      <p className="font-medium text-rose-100">Unable to load the question bank</p>
      <p className="mt-1 text-sm text-rose-200/75">
        {getApiErrorMessage(error, 'Unable to load questions.')}
      </p>
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

export function TeacherQuestionsPage() {
  useDocumentTitle('Question bank')

  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [searchDraft, setSearchDraft] = useState('')
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState(null)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const normalizedSearch = filters.search.trim().toLowerCase()
  const serverFilters = {
    difficulty: filters.difficulty,
    subjectId: filters.subjectId.trim(),
    type: filters.type,
  }
  const queryFilters = normalizedSearch
    ? { ...serverFilters, all: true, limit: SEARCH_FETCH_SIZE }
    : { ...serverFilters, limit: PAGE_SIZE, page }

  const questionsQuery = useQuery({
    queryFn: () =>
      normalizedSearch
        ? fetchAllFilteredQuestions(serverFilters)
        : listTeacherQuestions({ ...serverFilters, limit: PAGE_SIZE, page }),
    queryKey: teacherQueryKeys.questions(queryFilters),
  })
  const subjectsQuery = useQuery({
    queryFn: listTeacherSubjects,
    queryKey: teacherQueryKeys.subjects,
  })

  const sourceQuestions = questionsQuery.data?.questions ?? []
  const matchedQuestions = normalizedSearch
    ? sourceQuestions.filter((question) =>
        question.content.toLowerCase().includes(normalizedSearch),
      )
    : sourceQuestions
  const visibleQuestions = normalizedSearch
    ? matchedQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : matchedQuestions
  const pagination = normalizedSearch
    ? {
        limit: PAGE_SIZE,
        page,
        total: matchedQuestions.length,
        totalPages: Math.ceil(matchedQuestions.length / PAGE_SIZE),
      }
    : questionsQuery.data?.pagination
  const subjects = [...(subjectsQuery.data ?? [])].sort((left, right) =>
    formatSubjectLabel(left).localeCompare(formatSubjectLabel(right)),
  )
  const subjectLabelsById = new Map(
    subjects.map((subject) => [subject.id, formatSubjectLabel(subject)]),
  )

  async function refreshQuestions() {
    await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.questionsRoot })
  }

  const createMutation = useMutation({
    mutationFn: createTeacherQuestion,
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Unable to create this question.'))
    },
    onSuccess: async (question) => {
      await refreshQuestions()
      setEditor(null)
      setPage(1)
      setNotice('Question created successfully.')
      setFormError('')
      queryClient.setQueryData(teacherQueryKeys.question(question.id), question)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTeacherQuestion(id, payload),
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Unable to save this question.'))
    },
    onSuccess: async (question) => {
      await refreshQuestions()
      setEditor(null)
      setPage(1)
      setNotice('Question updated successfully.')
      setFormError('')
      queryClient.setQueryData(teacherQueryKeys.question(question.id), question)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTeacherQuestion,
    onError: (error) => {
      setDeleteError(getDeleteErrorMessage(error))
    },
    onSuccess: async () => {
      const shouldMoveBack = visibleQuestions.length === 1 && page > 1
      await refreshQuestions()
      setDeleteTarget(null)
      setDeleteError('')
      setNotice('Question deleted successfully.')
      if (shouldMoveBack) setPage((current) => Math.max(1, current - 1))
    },
  })

  const isFormPending = createMutation.isPending || updateMutation.isPending
  const isMutating = isFormPending || deleteMutation.isPending

  function openCreateForm() {
    createMutation.reset()
    updateMutation.reset()
    setEditor({ mode: 'create', question: null })
    setFormError('')
    setNotice('')
  }

  function openEditForm(question) {
    createMutation.reset()
    updateMutation.reset()
    setEditor({ mode: 'edit', question })
    setFormError('')
    setNotice('')
  }

  function closeForm() {
    if (isFormPending) return
    setEditor(null)
    setFormError('')
  }

  function submitQuestion(payload) {
    setFormError('')
    setNotice('')

    if (editor?.mode === 'edit') {
      updateMutation.mutate({ id: editor.question.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  function changeFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(1)
    setNotice('')
  }

  function applySearch(value) {
    const search = value.trim()
    setFilters((current) => ({ ...current, search }))
    setSearchDraft(search)
    setPage(1)
    setNotice('')
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setSearchDraft('')
    setPage(1)
    setNotice('')
  }

  function openDeleteDialog(question) {
    deleteMutation.reset()
    setDeleteTarget(question)
    setDeleteError('')
    setNotice('')
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return
    setDeleteTarget(null)
    setDeleteError('')
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
            Content library
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Question bank
          </h1>
          <p className="mt-3 leading-7 text-slate-400">
            Build reusable questions, define their answers, and organize them by subject before
            adding them to exams.
          </p>
        </div>
        <button
          className="bg-brand-500 hover:bg-brand-400 shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={
            isMutating || subjectsQuery.isPending || subjectsQuery.isError || !subjects.length
          }
          onClick={openCreateForm}
          type="button"
        >
          Create question
        </button>
      </header>

      {notice ? (
        <div
          className="mt-7 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {editor ? (
        <section className="mt-7 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              {editor.mode === 'edit' ? 'Edit question' : 'Create a question'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {editor.mode === 'edit'
                ? 'Saving changes updates this question wherever the backend allows it.'
                : 'Choose the type first so the correct answer fields match the question.'}
            </p>
          </div>
          <QuestionForm
            error={formError}
            isPending={isFormPending}
            key={editor.mode === 'edit' ? editor.question.id : 'create-question'}
            mode={editor.mode}
            onCancel={closeForm}
            onClearError={() => setFormError('')}
            onSubmit={submitQuestion}
            question={editor.question}
            subjects={subjects}
            subjectsLoading={subjectsQuery.isPending}
            subjectsUnavailable={subjectsQuery.isError}
          />
        </section>
      ) : null}

      <section className="mt-7 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">Your questions</h2>
          <p className="mt-1 text-sm text-slate-400">
            Filters run on the server. Text search checks every question in the filtered result.
          </p>
        </div>

        {subjectsQuery.isError ? (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
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
            className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            No subjects are available yet. Ask an administrator to create one before adding a
            question.
          </p>
        ) : null}

        <QuestionFilters
          filters={filters}
          onClear={clearFilters}
          onFilterChange={changeFilter}
          onSearch={applySearch}
          searchDraft={searchDraft}
          setSearchDraft={setSearchDraft}
          subjects={subjects}
          subjectsLoading={subjectsQuery.isPending}
          subjectsUnavailable={subjectsQuery.isError}
        />

        <div className="mt-6">
          {questionsQuery.isError ? (
            <QueryError error={questionsQuery.error} onRetry={() => questionsQuery.refetch()} />
          ) : (
            <QuestionTable
              disabled={isMutating}
              isPending={questionsQuery.isPending}
              onDelete={openDeleteDialog}
              onEdit={openEditForm}
              onPageChange={setPage}
              pagination={pagination}
              questions={visibleQuestions}
              subjectLabelsById={subjectLabelsById}
            />
          )}
        </div>
      </section>

      <QuestionDeleteDialog
        error={deleteError}
        isPending={deleteMutation.isPending}
        onCancel={closeDeleteDialog}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        question={deleteTarget}
      />
    </main>
  )
}
