import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard.jsx'
import { AuthError, AuthNotice } from '../../components/auth/AuthFeedback.jsx'
import { AuthField } from '../../components/auth/AuthField.jsx'
import { SubmitButton } from '../../components/auth/SubmitButton.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { apiClient, getApiErrorMessage } from '../../services/apiClient.js'
import {
  getValidationErrors,
  normalizeEmail,
  validateEmail,
  validateOtp,
  validateStrongPassword,
} from '../../utils/authValidation.js'

export function ResetPasswordPage() {
  useDocumentTitle('Choose a new password')

  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    email: searchParams.get('email') ?? '',
    newPassword: '',
    otp: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const notice = typeof location.state?.notice === 'string' ? location.state.notice : ''

  function updateField(event) {
    const { name, value } = event.target
    const nextValue = name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value
    setValues((current) => ({ ...current, [name]: nextValue }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = getValidationErrors(values, {
      email: validateEmail,
      newPassword: validateStrongPassword,
      otp: validateOtp,
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      await apiClient.post('/auth/reset-password', {
        email: normalizeEmail(values.email),
        newPassword: values.newPassword,
        otp: values.otp,
      })
      navigate('/login', {
        replace: true,
        state: { notice: 'Password reset successfully. Sign in with your new password.' },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to reset your password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      description="Enter the code from your email and choose a new password."
      footer={
        <Link className="text-brand-400 hover:text-brand-100 font-semibold" to="/login">
          Back to sign in
        </Link>
      }
      title="Choose a new password"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthNotice message={notice} />
        <AuthError message={formError} />
        <AuthField
          autoComplete="email"
          disabled={isSubmitting}
          error={fieldErrors.email}
          id="reset-email"
          inputMode="email"
          label="Email address"
          maxLength={254}
          name="email"
          onChange={updateField}
          placeholder="you@example.com"
          required
          type="email"
          value={values.email}
        />
        <AuthField
          autoComplete="one-time-code"
          disabled={isSubmitting}
          error={fieldErrors.otp}
          id="reset-otp"
          inputMode="numeric"
          label="Reset code"
          maxLength={6}
          name="otp"
          onChange={updateField}
          pattern="[0-9]{6}"
          placeholder="000000"
          required
          type="text"
          value={values.otp}
        />
        <AuthField
          autoComplete="new-password"
          disabled={isSubmitting}
          error={fieldErrors.newPassword}
          helperText="Use 8 or more characters with at least one letter and one number."
          id="reset-new-password"
          label="New password"
          name="newPassword"
          onChange={updateField}
          required
          type="password"
          value={values.newPassword}
        />
        <SubmitButton isLoading={isSubmitting} loadingLabel="Updating password…">
          Update password
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
