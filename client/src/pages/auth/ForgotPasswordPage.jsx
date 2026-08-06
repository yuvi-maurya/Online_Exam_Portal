import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard.jsx'
import { AuthError } from '../../components/auth/AuthFeedback.jsx'
import { AuthField } from '../../components/auth/AuthField.jsx'
import { SubmitButton } from '../../components/auth/SubmitButton.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { apiClient, getApiErrorMessage } from '../../services/apiClient.js'
import { normalizeEmail, validateEmail } from '../../utils/authValidation.js'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('auth.forgotPassword.documentTitle'))

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateEmail(email)

    if (validationMessage) {
      setEmailError(validationMessage)
      return
    }

    const normalizedEmail = normalizeEmail(email)
    setIsSubmitting(true)
    setFormError('')

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: normalizedEmail,
      })
      navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`, {
        state: {
          notice: response?.message ?? t('auth.forgotPassword.success'),
        },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('auth.forgotPassword.errors.submit')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      description={t('auth.forgotPassword.description')}
      footer={
        <Link
          className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-100 font-semibold"
          to="/login"
        >
          {t('auth.backToSignIn')}
        </Link>
      }
      title={t('auth.forgotPassword.title')}
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthError message={formError} />
        <AuthField
          autoComplete="email"
          disabled={isSubmitting}
          error={emailError}
          id="forgot-email"
          inputMode="email"
          label={t('auth.fields.email')}
          maxLength={254}
          name="email"
          onChange={(event) => {
            setEmail(event.target.value)
            setEmailError('')
            setFormError('')
          }}
          placeholder={t('auth.placeholders.email')}
          required
          type="email"
          value={email}
        />
        <SubmitButton isLoading={isSubmitting} loadingLabel={t('auth.forgotPassword.sending')}>
          {t('auth.forgotPassword.submit')}
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
