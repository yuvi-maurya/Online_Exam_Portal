import { useContext } from 'react'
import { AuthContext } from '../context/authContext.js'
import i18n from '../i18n/index.js'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(i18n.t('errors.authProviderRequired'))
  }

  return context
}
