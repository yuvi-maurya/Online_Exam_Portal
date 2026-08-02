import { useState } from 'react'
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
  useDocumentTitle('Create account')

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
        state: { notice: 'Account created. Enter the verification code sent to your email.' },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to create your account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      description="Student registration is open. Teacher and admin accounts are created by an administrator."
      footer={
        <>
          Already registered?{' '}
          <Link className="text-brand-400 hover:text-brand-100 font-semibold" to="/login">
            Sign in
          </Link>
        </>
      }
      title="Create a student account"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthError message={formError} />
        <AuthField
          autoComplete="name"
          disabled={isSubmitting}
          error={fieldErrors.name}
          id="register-name"
          label="Full name"
          maxLength={100}
          name="name"
          onChange={updateField}
          placeholder="Your full name"
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
          autoComplete="new-password"
          disabled={isSubmitting}
          error={fieldErrors.password}
          helperText="Use 8 or more characters with at least one letter and one number."
          id="register-password"
          label="Password"
          name="password"
          onChange={updateField}
          required
          type="password"
          value={values.password}
        />
        <SubmitButton isLoading={isSubmitting} loadingLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
