import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './themeContext.js'

export const THEME_STORAGE_KEY = 'exam-portal-theme'

const DARK_THEME = 'dark'
const LIGHT_THEME = 'light'

function isTheme(value) {
  return value === DARK_THEME || value === LIGHT_THEME
}

function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return LIGHT_THEME
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME
}

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(storedTheme) ? storedTheme : null
  } catch {
    return null
  }
}

function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.toggle(DARK_THEME, theme === DARK_THEME)
  root.classList.toggle(LIGHT_THEME, theme === LIGHT_THEME)
  root.style.colorScheme = theme
}

function getInitialTheme() {
  const initialTheme = readStoredTheme() ?? getSystemTheme()
  applyTheme(initialTheme)
  return initialTheme
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Theme selection still works for this tab when browser storage is unavailable.
    }
  }, [theme])

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== THEME_STORAGE_KEY) {
        return
      }

      const nextTheme = isTheme(event.newValue) ? event.newValue : getSystemTheme()
      setThemeState(nextTheme)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setTheme = useCallback((nextTheme) => {
    setThemeState((currentTheme) => {
      const resolvedTheme = typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme

      return isTheme(resolvedTheme) ? resolvedTheme : currentTheme
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => (currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME))
  }, [])

  const value = useMemo(
    () => ({
      isDark: theme === DARK_THEME,
      setTheme,
      theme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
