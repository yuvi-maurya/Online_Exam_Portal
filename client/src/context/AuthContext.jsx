import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiClient } from '../services/apiClient.js'
import {
  clearStoredSession,
  getStoredSession,
  storeSession,
  subscribeToSessionChanges,
} from '../services/authSession.js'
import { AuthContext } from './authContext.js'
import i18n from '../i18n/index.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession)
  const [hydratedToken, setHydratedToken] = useState(null)
  const sessionRef = useRef(session)
  const queryClient = useQueryClient()
  const isLoading = Boolean(session?.token && hydratedToken !== session.token)

  const applySession = useCallback(
    (nextSession) => {
      const previousToken = sessionRef.current?.token ?? null
      const nextToken = nextSession?.token ?? null

      sessionRef.current = nextSession

      if (previousToken !== nextToken) {
        queryClient.clear()
        setHydratedToken(null)
      }

      setSession(nextSession)
    },
    [queryClient],
  )

  useEffect(() => subscribeToSessionChanges(applySession), [applySession])

  useEffect(() => {
    if (!session?.token || hydratedToken === session.token) {
      return undefined
    }

    const requestToken = session.token
    const controller = new AbortController()
    let isActive = true

    async function hydrateUser() {
      try {
        const response = await apiClient.get('/auth/me', {
          signal: controller.signal,
        })
        const user = response?.data?.user

        if (!user) {
          if (isActive && getStoredSession()?.token === requestToken) {
            clearStoredSession()
          }

          return
        }

        if (!isActive || getStoredSession()?.token !== requestToken) {
          return
        }

        const nextSession = { token: requestToken, user }
        storeSession(nextSession)
        applySession(nextSession)
        setHydratedToken(requestToken)
      } catch (error) {
        if (
          error.name !== 'AbortError' &&
          isActive &&
          error.status !== 401 &&
          getStoredSession()?.token === requestToken
        ) {
          applySession(getStoredSession())
          setHydratedToken(requestToken)
        }
      }
    }

    hydrateUser()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [applySession, hydratedToken, session?.token])

  const login = useCallback(
    async (credentials) => {
      const response = await apiClient.post('/auth/login', credentials)
      const authenticatedSession = response?.data

      if (!authenticatedSession?.token || !authenticatedSession?.user) {
        throw new Error(i18n.t('errors.invalidLoginResponse'))
      }

      storeSession(authenticatedSession)
      applySession(authenticatedSession)
      setHydratedToken(authenticatedSession.token)
      return authenticatedSession.user
    },
    [applySession],
  )

  const logout = useCallback(() => {
    clearStoredSession()
    applySession(null)
    setHydratedToken(null)
  }, [applySession])

  const register = useCallback(async (registration) => {
    const response = await apiClient.post('/auth/register', registration)
    return response?.data?.user
  }, [])

  const value = useMemo(
    () => ({
      isLoading,
      loading: isLoading,
      login,
      logout,
      register,
      token: session?.token ?? null,
      user: session?.user ?? null,
    }),
    [isLoading, login, logout, register, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
