import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  listTeacherSubjects,
  publishTeacherExam,
  scheduleTeacherExam,
  teacherQueryKeys,
  updateAttachedQuestion,
  updateTeacherExam,
} from '../../services/teacherApi.js'
import { ApiError, getApiErrorMessage } from '../../services/apiClient.js'
import { formatDateTime, formatExamType } from '../../utils/teacherExamValidation.js'
import { formatSubjectLabel } from '../../utils/teacherSubject.js'

const STATUS_STYLES = {
  ARCHIVED:
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/45 dark:text-slate-300',
  COMPLETED:
    'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200',
  DRAFT:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  ONGOING:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  PUBLISHED:
    'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
}

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
  const { t } = useTranslation()

  return (
    <main
      className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label={t('teacher.examBuilder.loading')}
    >
      <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="mt-8 h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/55" />
      <div className="mt-6 h-96 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/55" />
    </main>
  )
}

export function TeacherExamBuilderPage() {
  const { t } = useTranslation()
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
  useDocumentTitle(
    exam
      ? t('teacher.examBuilder.documentTitleWithExam', { title: exam.title })
      : t('teacher.examBuilder.title'),
  )

  const subjectsQuery = useQuery({
    queryFn: listTeacherSubjects,
    queryKey: teacherQueryKeys.subjects,
  })

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
      setBuilderError(getApiErrorMessage(error, t('teacher.examBuilder.errors.attach')))
    },
    onSuccess: (updatedExam) =>
      syncExam(updatedExam, t('teacher.examBuilder.notices.questionAttached')),
  })
  const updateExamMutation = useMutation({
    mutationFn: (payload) => updateTeacherExam(id, payload),
    onError: (error) => {
      setSettingsError(getApiErrorMessage(error, t('teacher.examBuilder.errors.settings')))
    },
    onSuccess: async (updatedExam) => {
      await syncExam(updatedExam, t('teacher.examBuilder.notices.settingsUpdated'))
      setSettingsError('')
      setShowSettingsForm(false)
    },
  })
  const updateQuestionMutation = useMutation({
    mutationFn: ({ changes, questionId }) => updateAttachedQuestion(id, questionId, changes),
    onError: (error) => {
      setBuilderError(getApiErrorMessage(error, t('teacher.examBuilder.errors.updateQuestion')))
    },
    onSuccess: (updatedExam) =>
      syncExam(updatedExam, t('teacher.examBuilder.notices.questionUpdated')),
  })
  const detachMutation = useMutation({
    mutationFn: (questionId) => detachExamQuestion(id, questionId),
    onError: (error) => {
      setBuilderError(getApiErrorMessage(error, t('teacher.examBuilder.errors.removeQuestion')))
    },
    onSuccess: (updatedExam) =>
      syncExam(updatedExam, t('teacher.examBuilder.notices.questionRemoved')),
  })
  const scheduleMutation = useMutation({
    mutationFn: (payload) => scheduleTeacherExam(id, payload),
    onError: (error) => {
      setScheduleError(getApiErrorMessage(error, t('teacher.examBuilder.errors.schedule')))
    },
    onSuccess: (updatedExam) =>
      syncExam(updatedExam, t('teacher.examBuilder.notices.scheduleSaved')),
  })
  const publishMutation = useMutation({
    mutationFn: () => publishTeacherExam(id),
    onError: (error) => {
      setLifecycleError(getApiErrorMessage(error, t('teacher.examBuilder.errors.publish')))
      setPublicationRequirements(getPublicationRequirements(error))
    },
    onSuccess: (updatedExam) => syncExam(updatedExam, t('teacher.examBuilder.notices.published')),
  })
  const archiveMutation = useMutation({
    mutationFn: () => archiveTeacherExam(id),
    onError: (error) => {
      setLifecycleError(getApiErrorMessage(error, t('teacher.examBuilder.errors.archive')))
    },
    onSuccess: (updatedExam) => syncExam(updatedExam, t('teacher.examBuilder.notices.archived')),
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteTeacherExam(id),
    onError: (error) => {
      setLifecycleError(getApiErrorMessage(error, t('teacher.examBuilder.errors.delete')))
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: teacherQueryKeys.exam(id) })
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.exams })
      navigate('/teacher/exams', { replace: true })
    },
  })

  const attachedQuestions = [...(exam?.questions ?? [])].sort((a, b) => a.order - b.order)
  const subjects = [...(subjectsQuery.data ?? [])].sort((left, right) =>
    formatSubjectLabel(left).localeCompare(formatSubjectLabel(right)),
  )
  const selectedSubject = subjects.find((subject) => subject.id === exam?.subjectId)
  const subjectLabel = selectedSubject ? formatSubjectLabel(selectedSubject) : ''
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
    if (!window.confirm(t('teacher.examBuilder.confirmRemoveQuestion'))) return
    setBuilderError('')
    setNotice('')
    detachMutation.mutate(attachment.questionId)
  }

  function publishExam() {
    resetFeedback()
    publishMutation.mutate()
  }

  function archiveExam() {
    if (!window.confirm(t('teacher.examBuilder.confirmArchive', { title: exam.title }))) return
    resetFeedback()
    archiveMutation.mutate()
  }

  function deleteExam() {
    if (!window.confirm(t('teacher.exams.confirmDelete', { title: exam.title }))) return
    resetFeedback()
    deleteMutation.mutate()
  }

  if (examQuery.isPending) return <DetailSkeleton />

  if (examQuery.isError || !exam) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Link
          className="text-brand-700 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 text-sm font-semibold"
          to="/teacher/exams"
        >
          {t('teacher.examBuilder.backToExams')}
        </Link>
        <div
          className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 p-5 dark:border-rose-500/25 dark:bg-rose-500/10"
          role="alert"
        >
          <p className="font-medium text-rose-800 dark:text-rose-100">
            {t('teacher.examBuilder.errors.openTitle')}
          </p>
          <p className="mt-1 text-sm text-rose-700 dark:text-rose-200/75">
            {getApiErrorMessage(examQuery.error, t('teacher.examBuilder.errors.load'))}
          </p>
          <button
            className="mt-4 rounded-lg border border-rose-400 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:text-rose-100 dark:hover:bg-rose-500/10"
            onClick={() => examQuery.refetch()}
            type="button"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </main>
    )
  }

  const isDraft = exam.status === 'DRAFT'
  const canDelete = isDraft && Number(exam.attemptCount ?? 0) === 0
  const canArchive = exam.status === 'PUBLISHED'
  const statusStyle =
    STATUS_STYLES[exam.status] ??
    'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        className="text-brand-700 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 text-sm font-semibold"
        to="/teacher/exams"
      >
        {t('teacher.examBuilder.backToExams')}
      </Link>

      <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-brand-700 dark:text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
              {t('teacher.examBuilder.title')}
            </p>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle}`}
            >
              {formatExamType(exam.status)}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            {exam.title}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {formatExamType(exam.type)} ·{' '}
            {subjectsQuery.isPending
              ? t('common.loadingSubject')
              : subjectLabel || t('common.subjectUnavailable')}
          </p>
        </div>
        <Link
          className="shrink-0 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          to={`/teacher/exams/${exam.id}/report`}
        >
          {t('common.viewReport')}
        </Link>
      </header>

      {notice ? (
        <div
          className="mt-7 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/55">
        {isDraft ? (
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t('teacher.examBuilder.settings.title')}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t('teacher.examBuilder.settings.description')}
              </p>
            </div>
            {!showSettingsForm ? (
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={lifecycleActionsDisabled}
                onClick={() => {
                  setSettingsError('')
                  setShowSettingsForm(true)
                }}
                type="button"
              >
                {t('teacher.examBuilder.settings.edit')}
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <dl className="rounded-xl bg-slate-100 p-4 dark:bg-slate-950/50">
            <dt className="text-xs text-slate-500 dark:text-slate-400">
              {t('exam.fields.passingMarks')}
            </dt>
            <dd className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              {exam.passingMarks}
            </dd>
          </dl>
          <dl className="rounded-xl bg-slate-100 p-4 dark:bg-slate-950/50">
            <dt className="text-xs text-slate-500 dark:text-slate-400">
              {t('exam.fields.duration')}
            </dt>
            <dd className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              {t('common.minutesShort', { count: exam.durationMinutes })}
            </dd>
          </dl>
          <dl className="rounded-xl bg-slate-100 p-4 dark:bg-slate-950/50">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{t('common.questions')}</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              {exam.questionCount ?? attachedQuestions.length}
            </dd>
          </dl>
          <dl className="rounded-xl bg-slate-100 p-4 dark:bg-slate-950/50">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{t('common.attempts')}</dt>
            <dd className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              {exam.attemptCount ?? 0}
            </dd>
          </dl>
        </div>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <p className="rounded-xl border border-slate-200 px-4 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <span className="text-slate-500 dark:text-slate-400">
              {t('teacher.exams.schedule.start')}:
            </span>{' '}
            {formatDateTime(exam.scheduledStart)}
          </p>
          <p className="rounded-xl border border-slate-200 px-4 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <span className="text-slate-500 dark:text-slate-400">
              {t('teacher.exams.schedule.end')}:
            </span>{' '}
            {formatDateTime(exam.scheduledEnd)}
          </p>
        </div>
        {showSettingsForm ? (
          <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
            {subjectsQuery.isError ? (
              <div
                className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100"
                role="alert"
              >
                <span>
                  {getApiErrorMessage(subjectsQuery.error, t('teacher.questions.errors.subjects'))}
                </span>
                <button
                  className="rounded-lg border border-rose-400 px-3 py-1.5 text-xs font-semibold transition hover:bg-rose-100 dark:border-rose-400/30 dark:hover:bg-rose-500/15"
                  onClick={() => subjectsQuery.refetch()}
                  type="button"
                >
                  {t('common.retry')}
                </button>
              </div>
            ) : null}
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
              subjects={subjects}
              subjectsLoading={subjectsQuery.isPending}
              subjectsUnavailable={subjectsQuery.isError}
            />
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/55">
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
              ? getApiErrorMessage(questionsQuery.error, t('teacher.examBuilder.errors.questions'))
              : ''
          }
          totalMarks={exam.totalMarks ?? 0}
        />
      </section>

      {isDraft ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/55">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t('teacher.examBuilder.schedule.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t('teacher.examBuilder.schedule.description')}
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

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/55">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t('teacher.examBuilder.lifecycle.title')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {t('teacher.examBuilder.lifecycle.description')}
            </p>
            {lifecycleError ? (
              <div
                className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100"
                role="alert"
              >
                <p>{lifecycleError}</p>
                {publicationRequirements.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-700/80 dark:text-rose-200/80">
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
                {publishMutation.isPending
                  ? t('teacher.examBuilder.lifecycle.publishing')
                  : t('teacher.examBuilder.lifecycle.publish')}
              </button>
            ) : null}
            {canArchive ? (
              <button
                className="rounded-xl border border-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-500/10"
                disabled={lifecycleActionsDisabled}
                onClick={archiveExam}
                type="button"
              >
                {archiveMutation.isPending
                  ? t('common.archiving')
                  : t('teacher.examBuilder.lifecycle.archive')}
              </button>
            ) : null}
            {canDelete ? (
              <button
                className="rounded-xl border border-rose-400 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-200 dark:hover:bg-rose-500/10"
                disabled={lifecycleActionsDisabled}
                onClick={deleteExam}
                type="button"
              >
                {deleteMutation.isPending
                  ? t('common.deleting')
                  : t('teacher.exams.list.deleteDraft')}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
