import { useEffect, useState } from 'react'
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
} from '../../utils/authValidation.js'

const RESEND_COOLDOWN_SECONDS = 60

export function VerifyEmailPage() {
  useDocumentTitle('Verify email')

  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    email: searchParams.get('email') ?? '',
    otp: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState(
    typeof location.state?.notice === 'string' ? location.state.notice : '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setCooldown((seconds) => Math.max(seconds - 1, 0))
    }, 1_000)

    return () => window.clearInterval(timer)
  }, [cooldown])

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
      otp: validateOtp,
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      await apiClient.post('/auth/verify-email', {
        email: normalizeEmail(values.email),
        otp: values.otp,
      })
      navigate('/login', {
        replace: true,
        state: { notice: 'Email verified. You can now sign in.' },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to verify your email.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    const emailError = validateEmail(values.email)

    if (emailError) {
      setFieldErrors((current) => ({ ...current, email: emailError }))
      return
    }

    setIsResending(true)
    setFormError('')
    setNotice('')

    try {
      const response = await apiClient.post('/auth/resend-otp', {
        email: normalizeEmail(values.email),
      })
      setNotice(
        response?.message ?? 'If the account is eligible, a new verification code has been sent.',
      )
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to resend the code.'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthCard
      description="Enter the six-digit code from your verification email."
      footer={
        <Link className="text-brand-400 hover:text-brand-100 font-semibold" to="/login">
          Back to sign in
        </Link>
      }
      title="Verify your email"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthNotice message={notice} />
        <AuthError message={formError} />
        <AuthField
          autoComplete="email"
          disabled={isSubmitting || isResending}
          error={fieldErrors.email}
          id="verify-email"
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
          id="verify-otp"
          inputMode="numeric"
          label="Verification code"
          maxLength={6}
          name="otp"
          onChange={updateField}
          pattern="[0-9]{6}"
          placeholder="000000"
          required
          type="text"
          value={values.otp}
        />
        <SubmitButton isLoading={isSubmitting} loadingLabel="Verifying…">
          Verify email
        </SubmitButton>
        <button
          className="focus-visible:outline-brand-400 w-full rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:text-slate-600"
          disabled={isResending || cooldown > 0 || isSubmitting}
          onClick={handleResend}
          type="button"
        >
          {isResending
            ? 'Sending a new code…'
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : 'Resend verification code'}
        </button>
      </form>
    </AuthCard>
  )
}
