import { useState } from 'react'
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
  validateStrongPassword,
} from '../../utils/authValidation.js'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('auth.resetPassword.documentTitle'))

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
        state: { notice: t('auth.resetPassword.success') },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('auth.resetPassword.errors.submit')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      description={t('auth.resetPassword.description')}
      footer={
        <Link
          className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-100 font-semibold"
          to="/login"
        >
          {t('auth.backToSignIn')}
        </Link>
      }
      title={t('auth.resetPassword.title')}
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
          id="reset-otp"
          inputMode="numeric"
          label={t('auth.fields.resetCode')}
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
          helperText={t('auth.passwordHint')}
          id="reset-new-password"
          label={t('auth.fields.newPassword')}
          name="newPassword"
          onChange={updateField}
          required
          type="password"
          value={values.newPassword}
        />
        <SubmitButton isLoading={isSubmitting} loadingLabel={t('auth.resetPassword.updating')}>
          {t('auth.resetPassword.submit')}
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
