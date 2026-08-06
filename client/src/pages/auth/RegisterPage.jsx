import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard.jsx'
import { AuthError } from '../../components/auth/AuthFeedback.jsx'
import { AuthField } from '../../components/auth/AuthField.jsx'
import { SubmitButton } from '../../components/auth/SubmitButton.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import {
  getValidationErrors,
  normalizeEmail,
  validateEmail,
  validateName,
  validateStrongPassword,
} from '../../utils/authValidation.js'

const INITIAL_VALUES = { email: '', name: '', password: '' }

export function RegisterPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('auth.register.documentTitle'))

  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      name: validateName,
      password: validateStrongPassword,
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const email = normalizeEmail(values.email)
    setIsSubmitting(true)
    setFormError('')

    try {
      await register({
        email,
        name: values.name.trim().replace(/\s+/g, ' '),
        password: values.password,
      })
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
        state: { notice: t('auth.register.success') },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('auth.register.errors.submit')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      description={t('auth.register.description')}
      footer={
        <>
          {t('auth.register.alreadyRegistered')}{' '}
          <Link
            className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-100 font-semibold"
            to="/login"
          >
            {t('auth.login.submit')}
          </Link>
        </>
      }
      title={t('auth.register.title')}
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthError message={formError} />
        <AuthField
          autoComplete="name"
          disabled={isSubmitting}
          error={fieldErrors.name}
          id="register-name"
          label={t('auth.fields.fullName')}
          maxLength={100}
          name="name"
          onChange={updateField}
          placeholder={t('auth.placeholders.fullName')}
          required
          type="text"
          value={values.name}
        />
        <AuthField
          autoComplete="email"
          disabled={isSubmitting}
          error={fieldErrors.email}
          id="register-email"
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
          autoComplete="new-password"
          disabled={isSubmitting}
          error={fieldErrors.password}
          helperText={t('auth.passwordHint')}
          id="register-password"
          label={t('auth.fields.password')}
          name="password"
          onChange={updateField}
          required
          type="password"
          value={values.password}
        />
        <SubmitButton isLoading={isSubmitting} loadingLabel={t('auth.register.creating')}>
          {t('auth.register.submit')}
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
