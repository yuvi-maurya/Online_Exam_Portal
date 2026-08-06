import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import i18n from '../../i18n/index.js'
import { ApiError, getApiErrorMessage } from '../../services/apiClient.js'
import { saveAnswer, studentQueryKeys } from '../../services/studentApi.js'

const TERMINAL_ATTEMPT_CODES = new Set(['ATTEMPT_NOT_IN_PROGRESS', 'ATTEMPT_TIME_EXPIRED'])
const TRANSIENT_ATTEMPT_CODES = new Set([
  'ANSWER_SAVE_CONFLICT',
  'ATTEMPT_STATE_CONFLICT',
  'ATTEMPT_TRANSACTION_CONFLICT',
  'ATTEMPT_TRANSACTION_TIMEOUT',
])
const ATTEMPT_DRAFT_STORAGE_PREFIX = 'exam-portal:attempt-drafts:'

function getDraftStorageKey(attemptId) {
  return `${ATTEMPT_DRAFT_STORAGE_PREFIX}${attemptId}`
}

function sanitizeStoredPayload(value, fallbackQuestionId) {
  if (!value || typeof value !== 'object') return null

  const questionId = String(value.questionId ?? fallbackQuestionId ?? '').trim()
  const hasOption =
    typeof value.selectedOptionId === 'string' && value.selectedOptionId.trim().length > 0
  const hasText = typeof value.answerText === 'string' && value.answerText.trim().length > 0

  if (!questionId || hasOption === hasText) return null

  return hasOption
    ? { questionId, selectedOptionId: value.selectedOptionId }
    : { answerText: value.answerText, questionId }
}

function writePersistedAnswers(attemptId, answers) {
  try {
    if (answers.size === 0) {
      window.sessionStorage.removeItem(getDraftStorageKey(attemptId))
      return
    }

    window.sessionStorage.setItem(
      getDraftStorageKey(attemptId),
      JSON.stringify(Object.fromEntries(answers)),
    )
  } catch {
    // The live queue remains authoritative when browser storage is unavailable.
  }
}

function readPersistedAnswers(attemptId) {
  const answers = new Map()

  try {
    const value = JSON.parse(window.sessionStorage.getItem(getDraftStorageKey(attemptId)) ?? '{}')

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [questionId, payload] of Object.entries(value)) {
        const safePayload = sanitizeStoredPayload(payload, questionId)
        if (safePayload) answers.set(safePayload.questionId, safePayload)
      }
    }

    // Rewriting strips any unknown fields instead of carrying them into a later replay.
    writePersistedAnswers(attemptId, answers)
  } catch {
    writePersistedAnswers(attemptId, answers)
  }

  return answers
}

function payloadsMatch(left, right) {
  const safeLeft = sanitizeStoredPayload(left)
  const safeRight = sanitizeStoredPayload(right)

  if (!safeLeft || !safeRight || safeLeft.questionId !== safeRight.questionId) return false
  if (Object.hasOwn(safeLeft, 'selectedOptionId')) {
    return safeLeft.selectedOptionId === safeRight.selectedOptionId
  }

  return safeLeft.answerText === safeRight.answerText
}

function persistPendingAnswer(attemptId, payload) {
  const safePayload = sanitizeStoredPayload(payload)
  if (!attemptId || !safePayload) return

  const answers = readPersistedAnswers(attemptId)
  answers.set(safePayload.questionId, safePayload)
  writePersistedAnswers(attemptId, answers)
}

function removePersistedAnswer(attemptId, questionId, expectedPayload) {
  if (!attemptId || !questionId) return

  const answers = readPersistedAnswers(attemptId)
  const persistedPayload = answers.get(questionId)

  if (expectedPayload && persistedPayload && !payloadsMatch(persistedPayload, expectedPayload)) {
    return
  }

  answers.delete(questionId)
  writePersistedAnswers(attemptId, answers)
}

export function clearAttemptDrafts(attemptId) {
  if (!attemptId) return

  try {
    window.sessionStorage.removeItem(getDraftStorageKey(attemptId))
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

export function isAttemptTerminalError(error) {
  return error instanceof ApiError && error.status === 409 && TERMINAL_ATTEMPT_CODES.has(error.code)
}

export function isAttemptTransientError(error) {
  if (!(error instanceof ApiError)) return true
  if (TRANSIENT_ATTEMPT_CODES.has(error.code)) return true
  return error.status === 408 || error.status === 429 || error.status >= 500
}

function normalizeAnswer(answer) {
  return {
    answerText: answer?.answerText ?? '',
    selectedOptionId: answer?.selectedOptionId ?? '',
  }
}

function mergeSafeSavedAnswer(attempt, savedAnswer, questionId) {
  if (!attempt) return attempt

  const answer = {
    answerText: savedAnswer?.answerText ?? null,
    questionId: savedAnswer?.questionId ?? questionId,
    selectedOptionId: savedAnswer?.selectedOptionId ?? null,
  }
  const answers = [...(attempt.answers ?? [])]
  const answerIndex = answers.findIndex((item) => item.questionId === questionId)

  if (answerIndex === -1) answers.push(answer)
  else answers[answerIndex] = answer

  return { ...attempt, answers }
}

export function useAttemptAutosave({
  allowedQuestionIds = [],
  attemptId,
  debounceMs = 500,
  enabled = true,
  onFinalized,
  serverAnswers = [],
}) {
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState({})
  const [saveStatuses, setSaveStatuses] = useState({})
  const [hasPendingSaves, setHasPendingSaves] = useState(false)
  const mountedRef = useRef(true)
  const activeQuestionRef = useRef(null)
  const activeEntryRef = useRef(null)
  const clearAfterActiveSaveRef = useRef(new Set())
  const confirmedAnswersRef = useRef(new Map())
  const flushingRef = useRef(false)
  const hydratedAttemptRef = useRef(null)
  const revisionRef = useRef(new Map())
  const stagedRef = useRef(new Map())
  const readyRef = useRef(new Map())
  const failedRef = useRef(new Map())
  const timersRef = useRef(new Map())
  const workerRef = useRef(null)
  const processQueueRef = useRef(null)
  const onFinalizedRef = useRef(onFinalized)

  const serverAnswersByQuestion = useMemo(
    () => new Map(serverAnswers.map((answer) => [answer.questionId, normalizeAnswer(answer)])),
    [serverAnswers],
  )

  useEffect(() => {
    onFinalizedRef.current = onFinalized
  }, [onFinalized])

  useEffect(() => {
    for (const [questionId, answer] of serverAnswersByQuestion.entries()) {
      confirmedAnswersRef.current.set(questionId, answer)
    }
  }, [serverAnswersByQuestion])

  const syncPendingState = useCallback(() => {
    if (!mountedRef.current) return

    setHasPendingSaves(
      Boolean(workerRef.current) ||
        stagedRef.current.size > 0 ||
        readyRef.current.size > 0 ||
        failedRef.current.size > 0,
    )
  }, [])

  const saveMutation = useMutation({
    mutationFn: ({ payload }) => saveAnswer(attemptId, payload),
    retry(failureCount, error) {
      const shouldRetry = failureCount < 3 && isAttemptTransientError(error)
      const questionId = activeQuestionRef.current

      if (shouldRetry && questionId && mountedRef.current) {
        setSaveStatuses((current) => ({
          ...current,
          [questionId]: { state: 'retrying' },
        }))
      }

      return shouldRetry
    },
    retryDelay(attemptIndex) {
      return Math.min(500 * 2 ** attemptIndex, 4000)
    },
  })

  const processQueue = useCallback(() => {
    if (!enabled) return Promise.resolve(false)
    if (workerRef.current) return workerRef.current

    const worker = (async () => {
      while (readyRef.current.size > 0) {
        const [questionId, entry] = readyRef.current.entries().next().value
        readyRef.current.delete(questionId)
        activeQuestionRef.current = questionId
        activeEntryRef.current = entry

        if (mountedRef.current) {
          setSaveStatuses((current) => ({
            ...current,
            [questionId]: { state: 'saving' },
          }))
        }

        try {
          const savedAnswer = await saveMutation.mutateAsync(entry)
          const safeSavedAnswer = normalizeAnswer(savedAnswer)
          confirmedAnswersRef.current.set(questionId, safeSavedAnswer)
          removePersistedAnswer(attemptId, questionId, entry.payload)

          queryClient.setQueryData(studentQueryKeys.attempt(attemptId), (attempt) =>
            mergeSafeSavedAnswer(attempt, savedAnswer, questionId),
          )

          const hasNewerAnswer =
            stagedRef.current.has(questionId) || readyRef.current.has(questionId)

          if (clearAfterActiveSaveRef.current.has(questionId)) {
            clearAfterActiveSaveRef.current.delete(questionId)
            failedRef.current.delete(questionId)
            if (mountedRef.current) {
              setDrafts((current) => ({ ...current, [questionId]: safeSavedAnswer }))
              setSaveStatuses((current) => ({
                ...current,
                [questionId]: { state: 'retained' },
              }))
            }
          } else if (!hasNewerAnswer && revisionRef.current.get(questionId) === entry.revision) {
            failedRef.current.delete(questionId)
            if (mountedRef.current) {
              setSaveStatuses((current) => ({
                ...current,
                [questionId]: { state: 'saved' },
              }))
            }
          }
        } catch (error) {
          if (isAttemptTerminalError(error)) {
            for (const timerId of timersRef.current.values()) window.clearTimeout(timerId)
            timersRef.current.clear()
            stagedRef.current.clear()
            readyRef.current.clear()
            failedRef.current.clear()
            clearAttemptDrafts(attemptId)
            onFinalizedRef.current?.(error)
            return false
          }

          const hasNewerAnswer =
            stagedRef.current.has(questionId) || readyRef.current.has(questionId)

          clearAfterActiveSaveRef.current.delete(questionId)

          if (!hasNewerAnswer) failedRef.current.set(questionId, entry)

          if (mountedRef.current && !hasNewerAnswer) {
            setSaveStatuses((current) => ({
              ...current,
              [questionId]: {
                message: getApiErrorMessage(error, i18n.t('student.attempt.errors.answerSave')),
                state: 'failed',
              },
            }))
          }
        } finally {
          activeQuestionRef.current = null
          activeEntryRef.current = null
          syncPendingState()
        }
      }

      return failedRef.current.size === 0
    })()

    workerRef.current = worker
    syncPendingState()

    void worker.finally(() => {
      workerRef.current = null
      syncPendingState()

      if (readyRef.current.size > 0) {
        window.queueMicrotask(() => processQueueRef.current?.())
      }
    })

    return worker
  }, [attemptId, enabled, queryClient, saveMutation, syncPendingState])

  useEffect(() => {
    processQueueRef.current = processQueue
  }, [processQueue])

  const moveStagedAnswerToQueue = useCallback(
    (questionId) => {
      const entry = stagedRef.current.get(questionId)
      if (!entry) return

      stagedRef.current.delete(questionId)
      readyRef.current.set(questionId, entry)
      timersRef.current.delete(questionId)
      syncPendingState()
      void processQueueRef.current?.()
    },
    [syncPendingState],
  )

  const updateAnswer = useCallback(
    (questionId, payload) => {
      if (!enabled) return

      const isEmptyTextAnswer =
        Object.hasOwn(payload, 'answerText') && !String(payload.answerText ?? '').trim()

      if (isEmptyTextAnswer) {
        const existingTimer = timersRef.current.get(questionId)
        if (existingTimer) window.clearTimeout(existingTimer)
        timersRef.current.delete(questionId)
        stagedRef.current.delete(questionId)
        readyRef.current.delete(questionId)
        failedRef.current.delete(questionId)

        if (activeQuestionRef.current === questionId && activeEntryRef.current) {
          clearAfterActiveSaveRef.current.add(questionId)
          setDrafts((current) => ({
            ...current,
            [questionId]: normalizeAnswer(activeEntryRef.current.payload),
          }))
          syncPendingState()
          return
        }

        removePersistedAnswer(attemptId, questionId)
        const confirmedAnswer = confirmedAnswersRef.current.get(questionId)
        setDrafts((current) => ({
          ...current,
          [questionId]: confirmedAnswer ?? normalizeAnswer(payload),
        }))
        setSaveStatuses((current) => ({
          ...current,
          [questionId]: { state: confirmedAnswer ? 'retained' : 'idle' },
        }))
        syncPendingState()
        return
      }

      clearAfterActiveSaveRef.current.delete(questionId)
      const revision = (revisionRef.current.get(questionId) ?? 0) + 1
      const normalizedPayload = {
        ...payload,
        questionId,
      }
      const entry = { payload: normalizedPayload, questionId, revision }

      persistPendingAnswer(attemptId, normalizedPayload)
      revisionRef.current.set(questionId, revision)
      stagedRef.current.set(questionId, entry)
      failedRef.current.delete(questionId)
      setDrafts((current) => ({
        ...current,
        [questionId]: normalizeAnswer(normalizedPayload),
      }))
      setSaveStatuses((current) => ({
        ...current,
        [questionId]: { state: 'queued' },
      }))

      const existingTimer = timersRef.current.get(questionId)
      if (existingTimer) window.clearTimeout(existingTimer)

      if (flushingRef.current) {
        moveStagedAnswerToQueue(questionId)
      } else {
        timersRef.current.set(
          questionId,
          window.setTimeout(() => moveStagedAnswerToQueue(questionId), debounceMs),
        )
      }
      syncPendingState()
    },
    [attemptId, debounceMs, enabled, moveStagedAnswerToQueue, syncPendingState],
  )

  const retryFailed = useCallback(
    (questionId) => {
      const entries = questionId
        ? [[questionId, failedRef.current.get(questionId)]]
        : [...failedRef.current.entries()]

      for (const [failedQuestionId, entry] of entries) {
        if (!entry) continue
        failedRef.current.delete(failedQuestionId)
        readyRef.current.set(failedQuestionId, entry)
        setSaveStatuses((current) => ({
          ...current,
          [failedQuestionId]: { state: 'saving' },
        }))
      }

      syncPendingState()
      return processQueueRef.current?.() ?? Promise.resolve(false)
    },
    [syncPendingState],
  )

  const flushAll = useCallback(async () => {
    flushingRef.current = true

    try {
      for (const timerId of timersRef.current.values()) window.clearTimeout(timerId)
      timersRef.current.clear()

      for (const [questionId, entry] of failedRef.current.entries()) {
        if (!readyRef.current.has(questionId)) readyRef.current.set(questionId, entry)
      }
      failedRef.current.clear()

      do {
        for (const [questionId, entry] of stagedRef.current.entries()) {
          readyRef.current.set(questionId, entry)
        }
        stagedRef.current.clear()
        syncPendingState()

        await (workerRef.current ?? processQueueRef.current?.() ?? Promise.resolve())
      } while (workerRef.current || readyRef.current.size > 0 || stagedRef.current.size > 0)

      syncPendingState()
      return failedRef.current.size === 0 && stagedRef.current.size === 0
    } finally {
      flushingRef.current = false
    }
  }, [syncPendingState])

  const getAnswer = useCallback(
    (questionId) =>
      drafts[questionId] ??
      serverAnswersByQuestion.get(questionId) ?? {
        answerText: '',
        selectedOptionId: '',
      },
    [drafts, serverAnswersByQuestion],
  )

  const getSaveStatus = useCallback(
    (questionId) => {
      if (saveStatuses[questionId]) return saveStatuses[questionId]
      return serverAnswersByQuestion.has(questionId) ? { state: 'saved' } : { state: 'idle' }
    },
    [saveStatuses, serverAnswersByQuestion],
  )
  const hasFailedSaves = Object.values(saveStatuses).some((status) => status.state === 'failed')

  useEffect(() => {
    if (!enabled || !attemptId || hydratedAttemptRef.current === attemptId) return undefined

    const timeoutId = window.setTimeout(() => {
      if (hydratedAttemptRef.current === attemptId) return
      hydratedAttemptRef.current = attemptId

      const allowedQuestions = new Set(allowedQuestionIds)
      const persistedAnswers = readPersistedAnswers(attemptId)

      for (const [questionId, payload] of persistedAnswers.entries()) {
        if (!allowedQuestions.has(questionId)) {
          removePersistedAnswer(attemptId, questionId)
          continue
        }

        const serverAnswer = serverAnswersByQuestion.get(questionId)
        if (serverAnswer && payloadsMatch(payload, { ...serverAnswer, questionId })) {
          removePersistedAnswer(attemptId, questionId, payload)
          continue
        }

        updateAnswer(questionId, payload)
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [allowedQuestionIds, attemptId, enabled, serverAnswersByQuestion, updateAnswer])

  useEffect(() => {
    mountedRef.current = true
    const timers = timersRef.current

    return () => {
      mountedRef.current = false
      for (const timerId of timers.values()) window.clearTimeout(timerId)
      timers.clear()
    }
  }, [])

  return {
    flushAll,
    getAnswer,
    getSaveStatus,
    hasFailedSaves,
    hasPendingSaves,
    retryFailed,
    updateAnswer,
  }
}
