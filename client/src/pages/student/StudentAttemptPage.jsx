import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Link, useNavigate, useParams } from 'react-router-dom'
import { AttemptNavigator } from '../../components/student/attempt/AttemptNavigator.jsx'
import { AttemptQuestion } from '../../components/student/attempt/AttemptQuestion.jsx'
import {
  ExamSecurityNotice,
  FullscreenGuardOverlay,
  WebcamPreview,
} from '../../components/student/security/index.js'
import { formatCountdown, useAttemptCountdown } from '../../hooks/student/useAttemptCountdown.js'
import {
  clearAttemptDrafts,
  isAttemptTerminalError,
  isAttemptTransientError,
  useAttemptAutosave,
} from '../../hooks/student/useAttemptAutosave.js'
import { useExamSecurity } from '../../hooks/student/useExamSecurity.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import {
  getAttempt,
  recordAttemptViolation,
  studentQueryKeys,
  submitAttempt,
} from '../../services/studentApi.js'
import { isAttemptAnswerComplete } from '../../utils/studentAttempt.js'

function formatSubject(subject) {
  if (typeof subject === 'string') return subject
  return subject?.name ?? subject?.title ?? subject?.code ?? 'General'
}

function AttemptLoadingState() {
  return (
    <main aria-busy="true" aria-label="Loading exam attempt" className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55" />
        <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55" />
      </div>
    </main>
  )
}

function AttemptLoadError({ error, onRetry }) {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div
        className="mx-auto max-w-2xl rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6"
        role="alert"
      >
        <h1 className="text-lg font-semibold text-rose-100">Unable to open this attempt</h1>
        <p className="mt-2 text-sm leading-6 text-rose-200/80">
          {getApiErrorMessage(error, 'The exam attempt could not be loaded.')}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-rose-400/30 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"
            onClick={onRetry}
            type="button"
          >
            Try again
          </button>
          <Link
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            to="/student"
          >
            Back to exams
          </Link>
        </div>
      </div>
    </main>
  )
}

function FinalizedAttemptRedirect({ attemptId }) {
  useEffect(() => {
    clearAttemptDrafts(attemptId)
  }, [attemptId])

  return <Navigate replace to={`/student/attempts/${attemptId}/result`} />
}

export function StudentAttemptPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [isPreparingSubmit, setIsPreparingSubmit] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const automaticSubmissionRef = useRef(false)
  const submissionStartedRef = useRef(false)
  const redirectedRef = useRef(false)

  const attemptQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getAttempt(id),
    queryKey: studentQueryKeys.attempt(id),
    retry(failureCount, error) {
      return !isAttemptTerminalError(error) && failureCount < 2 && isAttemptTransientError(error)
    },
  })
  const attempt = attemptQuery.data
  useDocumentTitle(attempt?.exam?.title ? `${attempt.exam.title} exam` : 'Exam attempt')

  const navigateToResult = useCallback(
    (notice) => {
      const securityNotice = typeof notice === 'string' ? notice : ''

      if (redirectedRef.current) return
      redirectedRef.current = true
      clearAttemptDrafts(id)
      navigate(`/student/attempts/${id}/result`, {
        replace: true,
        state: securityNotice ? { notice: securityNotice } : undefined,
      })
    },
    [id, navigate],
  )

  const submitMutation = useMutation({
    mutationFn: () => submitAttempt(id),
    onError(error) {
      if (isAttemptTerminalError(error)) {
        navigateToResult()
        return
      }

      submissionStartedRef.current = false
      setIsPreparingSubmit(false)
      setSubmitError(
        getApiErrorMessage(
          error,
          automaticSubmissionRef.current
            ? 'Time is up, but submission could not be confirmed. Please retry.'
            : 'Your exam could not be submitted. Your saved answers are still safe.',
        ),
      )
    },
    onSuccess(submittedAttempt) {
      queryClient.setQueryData(studentQueryKeys.attempt(id), submittedAttempt)
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.availableExams })
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.examHistory })
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.result(id) })
      navigateToResult()
    },
    retry(failureCount, error) {
      return failureCount < 2 && isAttemptTransientError(error)
    },
    retryDelay(attemptIndex) {
      return Math.min(700 * 2 ** attemptIndex, 3000)
    },
  })

  const violationMutation = useMutation({
    mutationFn: (type) => recordAttemptViolation(id, type),
    retry: false,
  })

  const reportSecurityViolation = useCallback(
    async (type) => {
      try {
        const violation = await violationMutation.mutateAsync(type)
        const reportedCount = Number(violation?.tabSwitchCount)

        if (Number.isFinite(reportedCount)) {
          queryClient.setQueryData(studentQueryKeys.attempt(id), (currentAttempt) =>
            currentAttempt
              ? {
                  ...currentAttempt,
                  tabSwitchCount: Math.max(
                    Number(currentAttempt.tabSwitchCount) || 0,
                    reportedCount,
                  ),
                }
              : currentAttempt,
          )
        }

        return violation
      } catch (error) {
        if (isAttemptTerminalError(error)) {
          navigateToResult(
            'The attempt was already finalized while the security event was being processed.',
          )
        }

        throw error
      }
    },
    [id, navigateToResult, queryClient, violationMutation],
  )

  const handleSecurityAutoFinalized = useCallback(
    (message) => {
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.availableExams })
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.examHistory })
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.result(id) })
      navigateToResult(message)
    },
    [id, navigateToResult, queryClient],
  )

  const submitNow = useCallback(() => {
    if (submissionStartedRef.current) return
    submissionStartedRef.current = true
    setIsPreparingSubmit(false)
    setSubmitError('')
    submitMutation.mutate()
  }, [submitMutation])

  const questions = useMemo(
    () =>
      [...(attempt?.questions ?? [])].sort(
        (left, right) => Number(left.order ?? 0) - Number(right.order ?? 0),
      ),
    [attempt?.questions],
  )
  const questionIds = useMemo(() => questions.map((question) => question.id), [questions])

  const autosave = useAttemptAutosave({
    allowedQuestionIds: questionIds,
    attemptId: id,
    enabled: attempt?.status === 'IN_PROGRESS' && !timeUp,
    onFinalized: () => navigateToResult(),
    serverAnswers: attempt?.answers ?? [],
  })

  const security = useExamSecurity({
    active: attempt?.status === 'IN_PROGRESS',
    fullScreenRequired: attempt?.exam?.fullScreenRequired === true,
    initialTabSwitchCount: attempt?.tabSwitchCount ?? 0,
    onAutoFinalized: handleSecurityAutoFinalized,
    onViolation: reportSecurityViolation,
    tabSwitchLimit: attempt?.exam?.tabSwitchLimit ?? null,
    webcamRequired: attempt?.exam?.webcamMonitoring === true,
  })

  const handleTimeExpired = useCallback(() => {
    if (automaticSubmissionRef.current) return

    automaticSubmissionRef.current = true
    setTimeUp(true)
    setIsPreparingSubmit(true)

    void (async () => {
      try {
        await autosave.flushAll()
      } catch {
        // Submission still proceeds; the server remains authoritative at the deadline.
      }

      if (redirectedRef.current) return
      setIsPreparingSubmit(false)
      submitNow()
    })()
  }, [autosave, submitNow])

  const countdown = useAttemptCountdown({
    deadlineAt: attempt?.deadlineAt,
    enabled: attempt?.status === 'IN_PROGRESS',
    onExpire: handleTimeExpired,
  })
  const currentQuestionId = questions.some((question) => question.id === selectedQuestionId)
    ? selectedQuestionId
    : questions[0]?.id
  const currentQuestionIndex = questions.findIndex((question) => question.id === currentQuestionId)
  const currentQuestion = questions[currentQuestionIndex]

  const answersByQuestion = useMemo(
    () =>
      new Map(
        questions.map((question) => [
          question.id,
          isAttemptAnswerComplete(question, autosave.getAnswer(question.id)),
        ]),
      ),
    [autosave, questions],
  )
  const unansweredCount = [...answersByQuestion.values()].filter((answered) => !answered).length
  const interactionDisabled =
    security.fullscreenBlocked ||
    timeUp ||
    isPreparingSubmit ||
    submitMutation.isPending ||
    attempt?.status !== 'IN_PROGRESS'

  async function handleManualSubmit() {
    const warning =
      unansweredCount > 0
        ? `You still have ${unansweredCount} unanswered ${
            unansweredCount === 1 ? 'question' : 'questions'
          }. Submit anyway? You cannot change answers afterward.`
        : 'Submit this exam now? You cannot change answers afterward.'

    if (!window.confirm(warning)) return

    setSubmitError('')
    setIsPreparingSubmit(true)

    try {
      const allAnswersSaved = await autosave.flushAll()

      if (redirectedRef.current || submissionStartedRef.current) return

      if (!allAnswersSaved) {
        setIsPreparingSubmit(false)
        setSubmitError(
          'At least one answer is not saved yet. Retry the failed save before submitting so no work is lost.',
        )
        return
      }

      submitNow()
    } catch {
      setIsPreparingSubmit(false)
      setSubmitError(
        'Your answer saves could not be confirmed. Retry the failed save before submitting.',
      )
    }
  }

  if (attemptQuery.isPending) return <AttemptLoadingState />

  if (isAttemptTerminalError(attemptQuery.error)) {
    return <FinalizedAttemptRedirect attemptId={id} />
  }

  if (attemptQuery.isError || !attempt) {
    return <AttemptLoadError error={attemptQuery.error} onRetry={() => attemptQuery.refetch()} />
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return <FinalizedAttemptRedirect attemptId={id} />
  }

  const remainingLabel =
    countdown.remainingMs === null ? '--:--' : formatCountdown(countdown.remainingMs)
  const timerIsUrgent = countdown.remainingMs !== null && countdown.remainingMs <= 5 * 60 * 1000

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <FullscreenGuardOverlay
        error={security.fullscreenError}
        isOpen={security.fullscreenBlocked}
        isRequesting={security.isRequestingFullscreen}
        onEnterFullscreen={security.enterFullscreen}
      />

      <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-brand-400 text-xs font-semibold tracking-[0.16em] uppercase">
              {formatSubject(attempt.exam.subject)}
            </p>
            <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {attempt.exam.title}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {answersByQuestion.size - unansweredCount} of {questions.length} answered
              {autosave.hasPendingSaves ? ' \u00b7 Unsaved changes pending' : ''}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            {attempt.exam.webcamMonitoring ? (
              <div className="w-full sm:w-56">
                <WebcamPreview
                  message={security.webcamMessage}
                  policyDecisionRequired={security.webcamPolicyDecisionRequired}
                  required
                  status={security.webcamStatus}
                  videoRef={security.setWebcamVideoElement}
                />
              </div>
            ) : null}

            <div
              aria-label={`${remainingLabel} remaining`}
              className={`shrink-0 rounded-xl border px-5 py-3 text-center ${
                timerIsUrgent
                  ? 'border-rose-500/35 bg-rose-500/10'
                  : 'border-brand-400/25 bg-brand-500/10'
              }`}
              role="timer"
            >
              <p
                className={`text-xs font-semibold ${timerIsUrgent ? 'text-rose-300' : 'text-brand-400'}`}
              >
                Time remaining
              </p>
              <p
                className={`mt-1 font-mono text-2xl font-bold tracking-wider ${
                  timerIsUrgent ? 'text-rose-100' : 'text-white'
                }`}
              >
                {remainingLabel}
              </p>
            </div>
          </div>
        </div>
      </header>

      {security.tabSwitchDetectionEnabled || security.warning ? (
        <div className="mt-5">
          <ExamSecurityNotice
            detectionEnabled={security.tabSwitchDetectionEnabled}
            onDismissWarning={security.dismissWarning}
            remainingTabSwitches={security.remainingTabSwitches}
            tabSwitchCount={security.tabSwitchCount}
            tabSwitchLimit={security.tabSwitchLimit}
            warning={security.warning}
          />
        </div>
      ) : null}

      {timeUp ? (
        <div
          className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          <p className="font-semibold">Time is up</p>
          <p className="mt-1 text-amber-200/80">
            {isPreparingSubmit
              ? 'Saving your latest answer before automatic submission\u2026'
              : submitMutation.isPending
                ? 'Confirming your automatic submission with the server\u2026'
                : 'The server will use its authoritative deadline for your attempt.'}
          </p>
        </div>
      ) : null}

      {submitError ? (
        <div
          className="mt-5 flex flex-col gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{submitError}</span>
          {timeUp && !submitMutation.isPending ? (
            <button
              className="shrink-0 rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-semibold transition hover:bg-rose-500/15"
              onClick={submitNow}
              type="button"
            >
              Retry submission
            </button>
          ) : autosave.hasFailedSaves ? (
            <button
              className="shrink-0 rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-semibold transition hover:bg-rose-500/15"
              onClick={() => {
                setSubmitError('')
                void autosave.retryFailed()
              }}
              type="button"
            >
              Retry unsaved answers
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <AttemptNavigator
          answersByQuestion={answersByQuestion}
          currentQuestionId={currentQuestionId}
          getSaveStatus={autosave.getSaveStatus}
          onSelect={setSelectedQuestionId}
          questions={questions}
        />

        <section className="min-w-0">
          {currentQuestion ? (
            <AttemptQuestion
              answer={autosave.getAnswer(currentQuestion.id)}
              disabled={interactionDisabled}
              number={currentQuestionIndex + 1}
              onAnswerChange={(payload) => autosave.updateAnswer(currentQuestion.id, payload)}
              onRetrySave={() => autosave.retryFailed(currentQuestion.id)}
              question={currentQuestion}
              saveStatus={autosave.getSaveStatus(currentQuestion.id)}
              total={questions.length}
            />
          ) : (
            <div
              className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6 text-amber-100"
              role="alert"
            >
              This attempt has no questions. Return to the exam list and contact your teacher.
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <button
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={currentQuestionIndex <= 0 || interactionDisabled}
                onClick={() => setSelectedQuestionId(questions[currentQuestionIndex - 1]?.id)}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={currentQuestionIndex >= questions.length - 1 || interactionDisabled}
                onClick={() => setSelectedQuestionId(questions[currentQuestionIndex + 1]?.id)}
                type="button"
              >
                Next
              </button>
            </div>

            <button
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={interactionDisabled || questions.length === 0}
              onClick={handleManualSubmit}
              type="button"
            >
              {isPreparingSubmit
                ? 'Saving answers\u2026'
                : submitMutation.isPending
                  ? 'Submitting\u2026'
                  : 'Submit exam'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
