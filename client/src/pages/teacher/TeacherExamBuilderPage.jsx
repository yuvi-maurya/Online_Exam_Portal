import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExamCreateForm } from '../../components/teacher/exams/ExamCreateForm.jsx'
import { ExamQuestionBuilder } from '../../components/teacher/exams/ExamQuestionBuilder.jsx'
import { ExamScheduleForm } from '../../components/teacher/exams/ExamScheduleForm.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import {
  archiveTeacherExam,
  attachExamQuestions,
  deleteTeacherExam,
  detachExamQuestion,
  getTeacherExam,
  listTeacherQuestions,
  publishTeacherExam,
  scheduleTeacherExam,
  teacherQueryKeys,
  updateAttachedQuestion,
  updateTeacherExam,
} from '../../services/teacherApi.js'
import { ApiError, getApiErrorMessage } from '../../services/apiClient.js'
import {
  EXAM_STATUS_STYLES,
  formatDateTime,
  formatExamType,
} from '../../utils/teacherExamValidation.js'

async function listAllSubjectQuestions(subjectId) {
  const firstPage = await listTeacherQuestions({ limit: 100, page: 1, subjectId })
  const totalPages = Math.max(1, Number(firstPage.pagination?.totalPages ?? 1))

  if (totalPages === 1) return firstPage.questions ?? []

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      listTeacherQuestions({ limit: 100, page: index + 2, subjectId }),
    ),
  )

  return [firstPage, ...remainingPages].flatMap((page) => page.questions ?? [])
}

function getPublicationRequirements(error) {
  return error instanceof ApiError && Array.isArray(error.details?.requirements)
    ? error.details.requirements
    : []
}

function DetailSkeleton() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10" aria-label="Loading exam builder">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-800" />
      <div className="mt-8 h-52 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55" />
      <div className="mt-6 h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55" />
    </main>
  )
}

export function TeacherExamBuilderPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [builderError, setBuilderError] = useState('')
  const [scheduleError, setScheduleError] = useState('')
  const [lifecycleError, setLifecycleError] = useState('')
  const [publicationRequirements, setPublicationRequirements] = useState([])
  const [settingsError, setSettingsError] = useState('')
  const [showSettingsForm, setShowSettingsForm] = useState(false)
  const [notice, setNotice] = useState('')

  const examQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getTeacherExam(id),
    queryKey: teacherQueryKeys.exam(id),
  })
  const exam = examQuery.data
  useDocumentTitle(exam ? `${exam.title} builder` : 'Exam builder')

  const questionsQuery = useQuery({
    enabled: Boolean(exam?.subjectId && exam.status === 'DRAFT'),
    queryFn: () => listAllSubjectQuestions(exam.subjectId),
    queryKey: ['teacher', 'questions', { all: true, subjectId: exam?.subjectId }],
  })

  async function syncExam(updatedExam, successMessage) {
    queryClient.setQueryData(teacherQueryKeys.exam(id), (currentExam) => ({
      ...currentExam,
      ...updatedExam,
      attemptCount: updatedExam.attemptCount ?? currentExam?.attemptCount,
      questionCount: updatedExam.questionCount ?? currentExam?.questionCount,
      questions: updatedExam.questions ?? currentExam?.questions ?? [],
    }))
    await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.exams })
    setLifecycleError('')
    setPublicationRequirements([])
    setNotice(successMessage)
  }

  const attachMutation = useMutation({
    mutationFn: (attachment) => attachExamQuestions(id, [attachment]),
    onError: (error) => {
      setBuilderError(getApiErrorMessage(error, 'Unable to attach this question.'))
    },
    onSuccess: (updatedExam) => syncExam(updatedExam, 'Question attached successfully.'),
  })
  const updateExamMutation = useMutation({
    mutationFn: (payload) => updateTeacherExam(id, payload),
    onError: (error) => {
      setSettingsError(getApiErrorMessage(error, 'Unable to update these exam settings.'))
    },
    onSuccess: async (updatedExam) => {
      await syncExam(updatedExam, 'Exam settings updated successfully.')
      setSettingsError('')
      setShowSettingsForm(false)
    },
  })
  const updateQuestionMutation = useMutation({
    mutationFn: ({ changes, questionId }) => updateAttachedQuestion(id, questionId, changes),
    onError: (error) => {
      setBuilderError(getApiErrorMessage(error, 'Unable to update this attached question.'))
    },
    onSuccess: (updatedExam) => syncExam(updatedExam, 'Question marks and order updated.'),
  })
  const detachMutation = useMutation({
    mutationFn: (questionId) => detachExamQuestion(id, questionId),
    onError: (error) => {
      setBuilderError(getApiErrorMessage(error, 'Unable to remove this question.'))
    },
    onSuccess: (updatedExam) => syncExam(updatedExam, 'Question removed from the exam.'),
  })
  const scheduleMutation = useMutation({
    mutationFn: (payload) => scheduleTeacherExam(id, payload),
    onError: (error) => {
      setScheduleError(getApiErrorMessage(error, 'Unable to save this schedule.'))
    },
    onSuccess: (updatedExam) => syncExam(updatedExam, 'Exam schedule saved.'),
  })
  const publishMutation = useMutation({
    mutationFn: () => publishTeacherExam(id),
    onError: (error) => {
      setLifecycleError(getApiErrorMessage(error, 'Unable to publish this exam.'))
      setPublicationRequirements(getPublicationRequirements(error))
    },
    onSuccess: (updatedExam) => syncExam(updatedExam, 'Exam published successfully.'),
  })
  const archiveMutation = useMutation({
    mutationFn: () => archiveTeacherExam(id),
    onError: (error) => {
      setLifecycleError(getApiErrorMessage(error, 'Unable to archive this exam.'))
    },
    onSuccess: (updatedExam) => syncExam(updatedExam, 'Exam archived successfully.'),
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteTeacherExam(id),
    onError: (error) => {
      setLifecycleError(getApiErrorMessage(error, 'Unable to delete this exam.'))
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: teacherQueryKeys.exam(id) })
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.exams })
      navigate('/teacher/exams', { replace: true })
    },
  })

  const attachedQuestions = [...(exam?.questions ?? [])].sort((a, b) => a.order - b.order)
  const attachedIds = new Set(attachedQuestions.map((attachment) => attachment.questionId))
  const availableQuestions = (questionsQuery.data ?? []).filter(
    (question) => !attachedIds.has(question.id),
  )

  const builderMutation = attachMutation.isPending
    ? { kind: 'attach' }
    : updateQuestionMutation.isPending
      ? { kind: 'update', questionId: updateQuestionMutation.variables?.questionId }
      : detachMutation.isPending
        ? { kind: 'detach', questionId: detachMutation.variables }
        : null
  const builderPending = Boolean(builderMutation)
  const schedulePending = scheduleMutation.isPending
  const settingsPending = updateExamMutation.isPending
  const lifecyclePending =
    publishMutation.isPending || archiveMutation.isPending || deleteMutation.isPending
  const lifecycleActionsDisabled =
    lifecyclePending || builderPending || schedulePending || settingsPending

  function resetFeedback() {
    setNotice('')
    setLifecycleError('')
    setPublicationRequirements([])
  }

  function attachQuestion(attachment) {
    setBuilderError('')
    setNotice('')
    attachMutation.mutate(attachment)
  }

  function updateQuestion(questionId, changes) {
    setBuilderError('')
    setNotice('')
    updateQuestionMutation.mutate({ changes, questionId })
  }

  function detachQuestion(attachment) {
    if (!window.confirm('Remove this question from the exam?')) return
    setBuilderError('')
    setNotice('')
    detachMutation.mutate(attachment.questionId)
  }

  function publishExam() {
    resetFeedback()
    publishMutation.mutate()
  }

  function archiveExam() {
    if (!window.confirm(`Archive “${exam.title}”?`)) return
    resetFeedback()
    archiveMutation.mutate()
  }

  function deleteExam() {
    if (!window.confirm(`Permanently delete the unused draft “${exam.title}”?`)) return
    resetFeedback()
    deleteMutation.mutate()
  }

  if (examQuery.isPending) return <DetailSkeleton />

  if (examQuery.isError || !exam) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Link
          className="text-brand-400 hover:text-brand-300 text-sm font-semibold"
          to="/teacher/exams"
        >
          ← Back to exams
        </Link>
        <div className="mt-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5" role="alert">
          <p className="font-medium text-rose-100">Unable to open this exam</p>
          <p className="mt-1 text-sm text-rose-200/75">
            {getApiErrorMessage(examQuery.error, 'The exam could not be loaded.')}
          </p>
          <button
            className="mt-4 rounded-lg border border-rose-400/30 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/10"
            onClick={() => examQuery.refetch()}
            type="button"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  const isDraft = exam.status === 'DRAFT'
  const canDelete = isDraft && Number(exam.attemptCount ?? 0) === 0
  const canArchive = exam.status === 'PUBLISHED'
  const statusStyle =
    EXAM_STATUS_STYLES[exam.status] ?? 'border-slate-700 bg-slate-800 text-slate-300'

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        className="text-brand-400 hover:text-brand-300 text-sm font-semibold"
        to="/teacher/exams"
      >
        ← Back to exams
      </Link>

      <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
              Exam builder
            </p>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle}`}
            >
              {formatExamType(exam.status)}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {exam.title}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            {formatExamType(exam.type)} · Subject {exam.subjectId}
          </p>
        </div>
        <Link
          className="shrink-0 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          to={`/teacher/exams/${exam.id}/report`}
        >
          View report
        </Link>
      </header>

      {notice ? (
        <div
          className="mt-7 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <section className="mt-7 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
        {isDraft ? (
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Exam settings</h2>
              <p className="mt-1 text-sm text-slate-400">
                Update delivery, scoring, and security settings while this exam is a draft.
              </p>
            </div>
            {!showSettingsForm ? (
              <button
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={lifecycleActionsDisabled}
                onClick={() => {
                  setSettingsError('')
                  setShowSettingsForm(true)
                }}
                type="button"
              >
                Edit settings
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <dl className="rounded-xl bg-slate-950/50 p-4">
            <dt className="text-xs text-slate-500">Passing marks</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{exam.passingMarks}</dd>
          </dl>
          <dl className="rounded-xl bg-slate-950/50 p-4">
            <dt className="text-xs text-slate-500">Duration</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{exam.durationMinutes} min</dd>
          </dl>
          <dl className="rounded-xl bg-slate-950/50 p-4">
            <dt className="text-xs text-slate-500">Questions</dt>
            <dd className="mt-1 text-xl font-semibold text-white">
              {exam.questionCount ?? attachedQuestions.length}
            </dd>
          </dl>
          <dl className="rounded-xl bg-slate-950/50 p-4">
            <dt className="text-xs text-slate-500">Attempts</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{exam.attemptCount ?? 0}</dd>
          </dl>
        </div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <p className="rounded-xl border border-slate-800 px-4 py-3 text-slate-400">
            <span className="text-slate-500">Scheduled start:</span>{' '}
            {formatDateTime(exam.scheduledStart)}
          </p>
          <p className="rounded-xl border border-slate-800 px-4 py-3 text-slate-400">
            <span className="text-slate-500">Scheduled end:</span>{' '}
            {formatDateTime(exam.scheduledEnd)}
          </p>
        </div>
        {showSettingsForm ? (
          <div className="mt-5 border-t border-slate-800 pt-5">
            <ExamCreateForm
              disabled={builderPending || schedulePending || lifecyclePending}
              error={settingsError}
              exam={exam}
              isPending={settingsPending}
              key={`settings-${exam.id}`}
              mode="edit"
              onCancel={() => {
                if (!settingsPending) {
                  setSettingsError('')
                  setShowSettingsForm(false)
                }
              }}
              onClearError={() => setSettingsError('')}
              onSubmit={(payload) => {
                setSettingsError('')
                setNotice('')
                updateExamMutation.mutate(payload)
              }}
              subjectIds={[exam.subjectId]}
            />
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
        <ExamQuestionBuilder
          attachments={attachedQuestions}
          availableQuestions={availableQuestions}
          editable={isDraft}
          error={builderError}
          isLoadingQuestions={questionsQuery.isPending && isDraft}
          interactionDisabled={lifecyclePending || schedulePending || settingsPending}
          mutation={builderMutation}
          onAttach={attachQuestion}
          onDetach={detachQuestion}
          onRetryQuestions={() => questionsQuery.refetch()}
          onSave={updateQuestion}
          questionsError={
            questionsQuery.isError
              ? getApiErrorMessage(questionsQuery.error, 'The question bank could not be loaded.')
              : ''
          }
          totalMarks={exam.totalMarks ?? 0}
        />
      </section>

      {isDraft ? (
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Schedule</h2>
            <p className="mt-1 text-sm text-slate-400">
              Both times are required, and the start must still be in the future when publishing.
            </p>
          </div>
          <ExamScheduleForm
            disabled={builderPending || lifecyclePending || settingsPending}
            error={scheduleError}
            exam={exam}
            isPending={scheduleMutation.isPending}
            key={`${exam.scheduledStart}-${exam.scheduledEnd}`}
            onClearError={() => setScheduleError('')}
            onSubmit={(payload) => {
              setScheduleError('')
              setNotice('')
              scheduleMutation.mutate(payload)
            }}
          />
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-white">Exam lifecycle</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Publish a complete scheduled draft. Published exams can be archived, while only unused
              drafts can be permanently deleted.
            </p>
            {lifecycleError ? (
              <div
                className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                role="alert"
              >
                <p>{lifecycleError}</p>
                {publicationRequirements.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-200/80">
                    {publicationRequirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            {isDraft ? (
              <button
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={lifecycleActionsDisabled}
                onClick={publishExam}
                type="button"
              >
                {publishMutation.isPending ? 'Publishing…' : 'Publish exam'}
              </button>
            ) : null}
            {canArchive ? (
              <button
                className="rounded-xl border border-amber-500/30 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={lifecycleActionsDisabled}
                onClick={archiveExam}
                type="button"
              >
                {archiveMutation.isPending ? 'Archiving…' : 'Archive exam'}
              </button>
            ) : null}
            {canDelete ? (
              <button
                className="rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={lifecycleActionsDisabled}
                onClick={deleteExam}
                type="button"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete draft'}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
