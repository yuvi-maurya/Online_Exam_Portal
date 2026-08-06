import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard.jsx'
import { AuthError, AuthNotice } from '../../components/auth/AuthFeedback.jsx'
import { AuthField } from '../../components/auth/AuthField.jsx'
import { SubmitButton } from '../../components/auth/SubmitButton.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import {
  getValidationErrors,
  normalizeEmail,
  validateEmail,
  validateLoginPassword,
} from '../../utils/authValidation.js'
import { getRoleHomeRoute } from '../../utils/roleRoutes.js'

const INITIAL_VALUES = { email: '', password: '' }

export function LoginPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('auth.login.documentTitle'))

  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const notice = typeof location.state?.notice === 'string' ? location.state.notice : ''

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = getValidationErrors(values, {
      email: validateEmail,
      password: validateLoginPassword,
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      const result = await login({
        email: normalizeEmail(values.email),
        password: values.password,
      })
      const user = result?.user ?? result
      navigate(getRoleHomeRoute(user?.role), { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('auth.login.errors.submit')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      description={t('auth.login.description')}
      footer={
        <>
          {t('auth.login.newUser')}{' '}
          <Link
            className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-100 font-semibold"
            to="/register"
          >
            {t('auth.login.createAccount')}
          </Link>
        </>
      }
      title={t('auth.login.title')}
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthNotice message={notice} />
        <AuthError message={formError} />
        <AuthField
          autoComplete="email"
          disabled={isSubmitting}
          error={fieldErrors.email}
          id="login-email"
          inputMode="email"
          label={t('auth.fields.email')}
          name="email"
          onChange={updateField}
          placeholder={t('auth.placeholders.email')}
          required
          type="email"
          value={values.email}
        />
        <AuthField
          autoComplete="current-password"
          disabled={isSubmitting}
          error={fieldErrors.password}
          id="login-password"
          label={t('auth.fields.password')}
          name="password"
          onChange={updateField}
          required
          type="password"
          value={values.password}
        />
        <div className="flex justify-end">
          <Link
            className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-100 text-sm font-medium"
            to="/forgot-password"
          >
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
        <SubmitButton isLoading={isSubmitting} loadingLabel={t('auth.login.signingIn')}>
          {t('auth.login.submit')}
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
