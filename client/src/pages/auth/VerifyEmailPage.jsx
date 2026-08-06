import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  useDocumentTitle(t('auth.verifyEmail.documentTitle'))

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
        state: { notice: t('auth.verifyEmail.success') },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('auth.verifyEmail.errors.submit')))
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
      setNotice(response?.message ?? t('auth.verifyEmail.resendSuccess'))
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('auth.verifyEmail.errors.resend')))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthCard
      description={t('auth.verifyEmail.description')}
      footer={
        <Link
          className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-100 font-semibold"
          to="/login"
        >
          {t('auth.backToSignIn')}
        </Link>
      }
      title={t('auth.verifyEmail.title')}
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
          label={t('auth.fields.email')}
          maxLength={254}
          name="email"
          onChange={updateField}
          placeholder={t('auth.placeholders.email')}
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
          label={t('auth.fields.verificationCode')}
          maxLength={6}
          name="otp"
          onChange={updateField}
          pattern="[0-9]{6}"
          placeholder="000000"
          required
          type="text"
          value={values.otp}
        />
        <SubmitButton isLoading={isSubmitting} loadingLabel={t('auth.verifyEmail.verifying')}>
          {t('auth.verifyEmail.submit')}
        </SubmitButton>
        <button
          className="focus-visible:outline-brand-400 w-full rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-300 dark:hover:text-white dark:disabled:text-slate-600"
          disabled={isResending || cooldown > 0 || isSubmitting}
          onClick={handleResend}
          type="button"
        >
          {isResending
            ? t('auth.verifyEmail.resending')
            : cooldown > 0
              ? t('auth.verifyEmail.resendCooldown', { count: cooldown })
              : t('auth.verifyEmail.resend')}
        </button>
      </form>
    </AuthCard>
  )
}
