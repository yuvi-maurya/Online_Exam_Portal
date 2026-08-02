const SESSION_STORAGE_KEY = 'exam-portal.auth-session'

export const AUTH_SESSION_CHANGED_EVENT = 'exam-portal:auth-session-changed'

let memorySession = null
let storageUnavailable = false

function isSession(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.token === 'string' &&
    value.token.length > 0 &&
    value.user !== null &&
    typeof value.user === 'object'
  )
}

function getBrowserStorage() {
  if (typeof window === 'undefined' || storageUnavailable) {
    return null
  }

  try {
    return window.localStorage
  } catch {
    storageUnavailable = true
    return null
  }
}

function notifySessionChanged(session) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_CHANGED_EVENT, {
        detail: session,
      }),
    )
  }
}

export function getStoredSession() {
  const storage = getBrowserStorage()

  if (!storage) {
    return memorySession
  }

  try {
    const serializedSession = storage.getItem(SESSION_STORAGE_KEY)

    if (!serializedSession) {
      memorySession = null
      return null
    }

    const session = JSON.parse(serializedSession)
    memorySession = isSession(session) ? session : null
    return memorySession
  } catch {
    storageUnavailable = true
    return memorySession
  }
}

export function storeSession(session) {
  if (!isSession(session)) {
    throw new TypeError('A valid authenticated session is required')
  }

  memorySession = session
  const storage = getBrowserStorage()

  if (storage) {
    try {
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch {
      storageUnavailable = true
    }
  }

  notifySessionChanged(session)
  return session
}

export function clearStoredSession() {
  memorySession = null
  const storage = getBrowserStorage()

  if (storage) {
    try {
      storage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      storageUnavailable = true
    }
  }

  notifySessionChanged(null)
}

export function subscribeToSessionChanges(listener) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleSessionChange = (event) => {
    listener(event.detail)
  }
  const handleStorageChange = (event) => {
    if (event.key === SESSION_STORAGE_KEY) {
      listener(getStoredSession())
    }
  }

  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange)
  window.addEventListener('storage', handleStorageChange)

  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange)
    window.removeEventListener('storage', handleStorageChange)
  }
}
