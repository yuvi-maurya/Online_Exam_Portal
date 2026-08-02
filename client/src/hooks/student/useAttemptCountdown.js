import { useEffect, useMemo, useRef, useState } from 'react'

function toTimestamp(value) {
  const timestamp = Date.parse(value ?? '')
  return Number.isFinite(timestamp) ? timestamp : null
}

export function formatCountdown(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
        seconds,
      ).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function useAttemptCountdown({ deadlineAt, enabled = true, onExpire }) {
  const deadlineTimestamp = useMemo(() => toTimestamp(deadlineAt), [deadlineAt])
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now())
  const notifiedDeadlineRef = useRef(null)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!enabled || deadlineTimestamp === null) return undefined

    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Date.now())
    }, 500)

    return () => window.clearInterval(intervalId)
  }, [deadlineTimestamp, enabled])

  const remainingMs =
    deadlineTimestamp === null ? null : Math.max(0, deadlineTimestamp - currentTimestamp)

  useEffect(() => {
    if (
      enabled &&
      deadlineTimestamp !== null &&
      remainingMs === 0 &&
      notifiedDeadlineRef.current !== deadlineTimestamp
    ) {
      notifiedDeadlineRef.current = deadlineTimestamp
      onExpireRef.current?.()
    }
  }, [deadlineTimestamp, enabled, remainingMs])

  return {
    isExpired: remainingMs === 0,
    remainingMs,
  }
}
