import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard.jsx'
import { AuthError } from '../../components/auth/AuthFeedback.jsx'
import { AuthField } from '../../components/auth/AuthField.jsx'
import { SubmitButton } from '../../components/auth/SubmitButton.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { apiClient, getApiErrorMessage } from '../../services/apiClient.js'
import { normalizeEmail, validateEmail } from '../../utils/authValidation.js'

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')

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
          notice:
            response?.message ??
            'If an account exists for that email, a password reset code has been sent.',
        },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to request a password reset.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      description="We’ll send a six-digit reset code if an account exists for this email."
      footer={
        <Link className="text-brand-400 hover:text-brand-100 font-semibold" to="/login">
          Back to sign in
        </Link>
      }
      title="Reset your password"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthError message={formError} />
        <AuthField
          autoComplete="email"
          disabled={isSubmitting}
          error={emailError}
          id="forgot-email"
          inputMode="email"
          label="Email address"
          maxLength={254}
          name="email"
          onChange={(event) => {
            setEmail(event.target.value)
            setEmailError('')
            setFormError('')
          }}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <SubmitButton isLoading={isSubmitting} loadingLabel="Sending code…">
          Send reset code
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
