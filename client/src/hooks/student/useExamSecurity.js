import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import i18n from '../../i18n/index.js'

const AUTO_FINALIZED_STATUSES = new Set(['AUTO_SUBMITTED', 'EVALUATED'])
const RESTRICTED_CLIPBOARD_EVENTS = ['copy', 'cut', 'paste', 'contextmenu']

function toNonNegativeInteger(value) {
  if (value === null || value === undefined || value === '') return null

  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return null

  return Math.floor(number)
}

function getWebcamFailure(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return {
      message: i18n.t('student.security.webcam.errors.permissionDenied'),
      status: 'denied',
    }
  }

  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
    return {
      message: i18n.t('student.security.webcam.errors.notFound'),
      status: 'unavailable',
    }
  }

  return {
    message: i18n.t('student.security.webcam.errors.startFailed'),
    status: 'error',
  }
}

function getTabSwitchWarning({ count, limit, remaining }) {
  if (remaining === null) {
    return count === null
      ? i18n.t('student.security.warnings.tabSwitchRecorded')
      : i18n.t('student.security.warnings.tabSwitchRecordedWithCount', { count })
  }

  if (remaining === 0) {
    return i18n.t('student.security.warnings.noEventsRemaining')
  }

  return i18n.t('student.security.warnings.eventsRemaining', {
    count: remaining,
    limit,
  })
}

/**
 * Owns browser-only exam security behavior. Violation writes are deliberately isolated from
 * answer persistence: failures are reported to the console and never escape this hook.
 */
export function useExamSecurity({
  active,
  fullScreenRequired = false,
  initialTabSwitchCount = 0,
  onAutoFinalized,
  onViolation,
  tabSwitchLimit = null,
  webcamRequired = false,
}) {
  const normalizedTabSwitchLimit = useMemo(
    () => toNonNegativeInteger(tabSwitchLimit),
    [tabSwitchLimit],
  )
  const normalizedInitialCount = toNonNegativeInteger(initialTabSwitchCount) ?? 0
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document === 'undefined' ? false : Boolean(document.fullscreenElement),
  )
  const [isRequestingFullscreen, setIsRequestingFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')
  const [tabSwitchCount, setTabSwitchCount] = useState(normalizedInitialCount)
  const [remainingTabSwitches, setRemainingTabSwitches] = useState(() =>
    normalizedTabSwitchLimit === null
      ? null
      : Math.max(normalizedTabSwitchLimit - normalizedInitialCount, 0),
  )
  const [warning, setWarning] = useState(null)
  const [webcamState, setWebcamState] = useState({
    message: '',
    policyDecisionRequired: false,
    status: 'idle',
  })

  const activeRef = useRef(active)
  const autoFinalizedRef = useRef(false)
  const cleanupFullscreenRef = useRef(false)
  const enteredFullscreenRef = useRef(false)
  const exitReportedRef = useRef(false)
  const fullscreenRequestRef = useRef(null)
  const fullscreenRequiredRef = useRef(fullScreenRequired)
  const fullscreenSessionRef = useRef(0)
  const ownsFullscreenRef = useRef(false)
  const normalizedTabSwitchLimitRef = useRef(normalizedTabSwitchLimit)
  const onAutoFinalizedRef = useRef(onAutoFinalized)
  const onViolationRef = useRef(onViolation)
  const remainingTabSwitchesRef = useRef(remainingTabSwitches)
  const suppressAwayDetectionRef = useRef(0)
  const suppressAwayUntilRef = useRef(0)
  const tabSwitchCountRef = useRef(normalizedInitialCount)
  const tabSwitchBlurTimerRef = useRef(null)
  const webcamElementRef = useRef(null)
  const webcamStreamRef = useRef(null)

  const dismissWarning = useCallback(() => setWarning(null), [])

  const clearPendingTabSwitch = useCallback(() => {
    if (tabSwitchBlurTimerRef.current) {
      window.clearTimeout(tabSwitchBlurTimerRef.current)
      tabSwitchBlurTimerRef.current = null
    }
  }, [])

  const beginTrustedBrowserPrompt = useCallback(() => {
    clearPendingTabSwitch()
    suppressAwayDetectionRef.current += 1
    suppressAwayUntilRef.current = Math.max(suppressAwayUntilRef.current, Date.now() + 1000)
  }, [clearPendingTabSwitch])

  const endTrustedBrowserPrompt = useCallback(() => {
    clearPendingTabSwitch()
    suppressAwayDetectionRef.current = Math.max(suppressAwayDetectionRef.current - 1, 0)
    suppressAwayUntilRef.current = Math.max(suppressAwayUntilRef.current, Date.now() + 750)
  }, [clearPendingTabSwitch])

  useEffect(() => {
    activeRef.current = active
    if (active) autoFinalizedRef.current = false

    return () => {
      activeRef.current = false
    }
  }, [active])

  useEffect(() => {
    fullscreenRequiredRef.current = fullScreenRequired
  }, [fullScreenRequired])

  useEffect(() => {
    onAutoFinalizedRef.current = onAutoFinalized
  }, [onAutoFinalized])

  useEffect(() => {
    onViolationRef.current = onViolation
  }, [onViolation])

  useEffect(() => {
    normalizedTabSwitchLimitRef.current = normalizedTabSwitchLimit

    const nextCount = Math.max(tabSwitchCountRef.current, normalizedInitialCount)
    tabSwitchCountRef.current = nextCount
    setTabSwitchCount((current) => Math.max(current, nextCount))

    if (normalizedTabSwitchLimit === null) {
      remainingTabSwitchesRef.current = null
      setRemainingTabSwitches(null)
      return
    }

    const fromCount = Math.max(normalizedTabSwitchLimit - nextCount, 0)
    const nextRemaining =
      remainingTabSwitchesRef.current === null
        ? fromCount
        : Math.min(remainingTabSwitchesRef.current, fromCount)
    remainingTabSwitchesRef.current = nextRemaining
    setRemainingTabSwitches(nextRemaining)
  }, [normalizedInitialCount, normalizedTabSwitchLimit])

  const applyViolationResponse = useCallback((response, type) => {
    if (!response || typeof response !== 'object') return

    const responseCount = toNonNegativeInteger(response.tabSwitchCount)
    const nextCount =
      responseCount === null
        ? tabSwitchCountRef.current
        : Math.max(tabSwitchCountRef.current, responseCount)
    tabSwitchCountRef.current = nextCount
    setTabSwitchCount(nextCount)

    const responseRemaining = toNonNegativeInteger(response.remainingTabSwitches)
    const derivedRemaining =
      normalizedTabSwitchLimitRef.current === null
        ? null
        : Math.max(normalizedTabSwitchLimitRef.current - nextCount, 0)
    const reportedRemaining = responseRemaining ?? derivedRemaining

    if (reportedRemaining !== null) {
      const nextRemaining =
        remainingTabSwitchesRef.current === null
          ? reportedRemaining
          : Math.min(remainingTabSwitchesRef.current, reportedRemaining)
      remainingTabSwitchesRef.current = nextRemaining
      setRemainingTabSwitches(nextRemaining)
    }

    const wasAutoFinalized =
      response.autoFinalized === true ||
      response.limitExceeded === true ||
      AUTO_FINALIZED_STATUSES.has(response.status)

    if (wasAutoFinalized) {
      const finalizationMessage = response.limitExceeded
        ? i18n.t('student.security.warnings.limitExceeded')
        : i18n.t('student.security.warnings.timeElapsed')

      setWarning({
        message: finalizationMessage,
        tone: 'danger',
        type,
      })

      if (!autoFinalizedRef.current) {
        autoFinalizedRef.current = true
        onAutoFinalizedRef.current?.(finalizationMessage)
      }
      return
    }

    setWarning({
      message:
        type === 'TAB_SWITCH'
          ? getTabSwitchWarning({
              count: responseCount ?? nextCount,
              limit: normalizedTabSwitchLimitRef.current,
              remaining: reportedRemaining,
            })
          : i18n.t('student.security.warnings.fullscreenExit'),
      tone: 'warning',
      type,
    })
  }, [])

  const reportViolation = useCallback(
    async (type) => {
      if (!activeRef.current || autoFinalizedRef.current) return null

      try {
        const response = await onViolationRef.current?.(type)
        applyViolationResponse(response, type)
        return response ?? null
      } catch (error) {
        console.warn(`[Exam security] Failed to record ${type} violation.`, error)
        setWarning({
          message: i18n.t('student.security.warnings.connectionFailure'),
          tone: 'warning',
          type,
        })
        return null
      }
    },
    [applyViolationResponse],
  )

  const exitFullscreenWithoutViolation = useCallback(async () => {
    if (!document.fullscreenElement || typeof document.exitFullscreen !== 'function') return

    cleanupFullscreenRef.current = true
    ownsFullscreenRef.current = false

    try {
      await document.exitFullscreen()
    } catch (error) {
      console.warn('[Exam security] Full-screen cleanup failed.', error)
    } finally {
      cleanupFullscreenRef.current = false
    }
  }, [])

  const enterFullscreen = useCallback(() => {
    if (!activeRef.current || !fullscreenRequiredRef.current) return Promise.resolve(false)
    if (document.fullscreenElement) {
      enteredFullscreenRef.current = true
      exitReportedRef.current = false
      setIsFullscreen(true)
      setFullscreenError('')
      return Promise.resolve(true)
    }
    if (fullscreenRequestRef.current) return fullscreenRequestRef.current

    const rootElement = document.documentElement
    if (typeof rootElement?.requestFullscreen !== 'function') {
      setFullscreenError(i18n.t('student.security.fullscreen.errors.unsupported'))
      return Promise.resolve(false)
    }

    const requestSession = fullscreenSessionRef.current
    const request = Promise.resolve().then(async () => {
      setIsRequestingFullscreen(true)
      setFullscreenError('')
      beginTrustedBrowserPrompt()

      try {
        await rootElement.requestFullscreen()
        ownsFullscreenRef.current = true

        if (requestSession !== fullscreenSessionRef.current || !activeRef.current) {
          await exitFullscreenWithoutViolation()
          return false
        }

        enteredFullscreenRef.current = true
        exitReportedRef.current = false
        setIsFullscreen(true)
        return true
      } catch (error) {
        if (activeRef.current) {
          setIsFullscreen(false)
          setFullscreenError(
            error?.name === 'NotAllowedError'
              ? i18n.t('student.security.fullscreen.errors.confirmationRequired')
              : i18n.t('student.security.fullscreen.errors.startFailed'),
          )
        }
        return false
      } finally {
        endTrustedBrowserPrompt()
        setIsRequestingFullscreen(false)
      }
    })

    fullscreenRequestRef.current = request
    void request.finally(() => {
      if (fullscreenRequestRef.current === request) fullscreenRequestRef.current = null
    })
    return request
  }, [beginTrustedBrowserPrompt, endTrustedBrowserPrompt, exitFullscreenWithoutViolation])

  const setWebcamVideoElement = useCallback((element) => {
    if (webcamElementRef.current && webcamElementRef.current !== element) {
      webcamElementRef.current.srcObject = null
    }

    webcamElementRef.current = element
    if (!element || !webcamStreamRef.current) return

    element.srcObject = webcamStreamRef.current
    void element.play().catch(() => {
      // The muted preview can be started by the student's next gesture if autoplay is restricted.
    })
  }, [])

  useEffect(() => {
    if (!active || !fullScreenRequired) return undefined

    const session = fullscreenSessionRef.current + 1
    fullscreenSessionRef.current = session

    function handleFullscreenChange() {
      const fullscreenActive = Boolean(document.fullscreenElement)
      setIsFullscreen(fullscreenActive)

      if (fullscreenActive) {
        enteredFullscreenRef.current = true
        exitReportedRef.current = false
        setFullscreenError('')
        return
      }

      if (
        !cleanupFullscreenRef.current &&
        enteredFullscreenRef.current &&
        !exitReportedRef.current &&
        activeRef.current
      ) {
        exitReportedRef.current = true
        void reportViolation('FULLSCREEN_EXIT')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    handleFullscreenChange()

    const automaticRequestTimer = document.fullscreenElement
      ? null
      : window.setTimeout(() => void enterFullscreen(), 0)

    return () => {
      if (automaticRequestTimer) window.clearTimeout(automaticRequestTimer)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (fullscreenSessionRef.current === session) fullscreenSessionRef.current += 1

      if (ownsFullscreenRef.current && document.fullscreenElement) {
        void exitFullscreenWithoutViolation()
      }
    }
  }, [active, enterFullscreen, exitFullscreenWithoutViolation, fullScreenRequired, reportViolation])

  useEffect(() => {
    if (!active || normalizedTabSwitchLimit === null) return undefined

    let awayFromExam = false
    function recordSwitchAway() {
      if (
        awayFromExam ||
        !activeRef.current ||
        autoFinalizedRef.current ||
        suppressAwayDetectionRef.current > 0 ||
        Date.now() < suppressAwayUntilRef.current
      ) {
        return
      }

      awayFromExam = true
      void reportViolation('TAB_SWITCH')
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        clearPendingTabSwitch()
        recordSwitchAway()
      } else if (document.hasFocus()) {
        awayFromExam = false
      }
    }

    function handleWindowBlur() {
      clearPendingTabSwitch()
      if (suppressAwayDetectionRef.current > 0 || Date.now() < suppressAwayUntilRef.current) {
        return
      }
      tabSwitchBlurTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === 'visible' && document.hasFocus()) return
        recordSwitchAway()
      }, 150)
    }

    function handleWindowFocus() {
      clearPendingTabSwitch()
      if (document.visibilityState === 'visible') awayFromExam = false
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      clearPendingTabSwitch()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [active, clearPendingTabSwitch, normalizedTabSwitchLimit, reportViolation])

  useEffect(() => {
    if (!active) return undefined

    function preventRestrictedAction(event) {
      event.preventDefault()
    }

    function warnBeforeLeaving(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    for (const eventName of RESTRICTED_CLIPBOARD_EVENTS) {
      document.addEventListener(eventName, preventRestrictedAction, true)
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)

    return () => {
      for (const eventName of RESTRICTED_CLIPBOARD_EVENTS) {
        document.removeEventListener(eventName, preventRestrictedAction, true)
      }
      window.removeEventListener('beforeunload', warnBeforeLeaving)
    }
  }, [active])

  useEffect(() => {
    if (!active || !webcamRequired) return undefined

    let cancelled = false
    let stream = null

    async function startWebcamPreview() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setWebcamState({
          message: i18n.t('student.security.webcam.errors.unsupported'),
          policyDecisionRequired: true,
          status: 'unavailable',
        })
        return
      }

      setWebcamState({ message: '', policyDecisionRequired: false, status: 'requesting' })
      beginTrustedBrowserPrompt()

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop()
          return
        }

        webcamStreamRef.current = stream
        if (webcamElementRef.current) {
          webcamElementRef.current.srcObject = stream
          void webcamElementRef.current.play().catch(() => {
            // The muted preview can be started by the student's next gesture if required.
          })
        }
        setWebcamState({ message: '', policyDecisionRequired: false, status: 'active' })
      } catch (error) {
        if (!cancelled) {
          const failure = getWebcamFailure(error)
          setWebcamState({
            ...failure,
            policyDecisionRequired: true,
          })
        }
      } finally {
        endTrustedBrowserPrompt()
      }
    }

    void startWebcamPreview()

    return () => {
      cancelled = true
      const activeStream = stream ?? webcamStreamRef.current
      if (activeStream) {
        for (const track of activeStream.getTracks()) track.stop()
      }
      webcamStreamRef.current = null
      if (webcamElementRef.current) webcamElementRef.current.srcObject = null
    }
  }, [active, beginTrustedBrowserPrompt, endTrustedBrowserPrompt, webcamRequired])

  return {
    dismissWarning,
    enterFullscreen,
    fullscreenBlocked: active && fullScreenRequired && !isFullscreen,
    fullscreenError,
    isFullscreen,
    isRequestingFullscreen,
    remainingTabSwitches,
    setWebcamVideoElement,
    tabSwitchCount,
    tabSwitchDetectionEnabled: active && normalizedTabSwitchLimit !== null,
    tabSwitchLimit: normalizedTabSwitchLimit,
    warning,
    webcamMessage: webcamState.message,
    webcamPolicyDecisionRequired: webcamState.policyDecisionRequired,
    webcamStatus: webcamState.status,
  }
}
