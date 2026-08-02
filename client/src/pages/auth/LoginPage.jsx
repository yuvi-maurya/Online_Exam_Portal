import { useState } from 'react'
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
  useDocumentTitle('Sign in')

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
      setFormError(getApiErrorMessage(error, 'Unable to sign in.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      description="Use your verified Exam Portal account to continue."
      footer={
        <>
          New to Exam Portal?{' '}
          <Link className="text-brand-400 hover:text-brand-100 font-semibold" to="/register">
            Create an account
          </Link>
        </>
      }
      title="Welcome back"
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
          label="Email address"
          name="email"
          onChange={updateField}
          placeholder="you@example.com"
          required
          type="email"
          value={values.email}
        />
        <AuthField
          autoComplete="current-password"
          disabled={isSubmitting}
          error={fieldErrors.password}
          id="login-password"
          label="Password"
          name="password"
          onChange={updateField}
          required
          type="password"
          value={values.password}
        />
        <div className="flex justify-end">
          <Link
            className="text-brand-400 hover:text-brand-100 text-sm font-medium"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <SubmitButton isLoading={isSubmitting} loadingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
