import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard.jsx'
import { AuthError } from '../components/auth/AuthFeedback.jsx'
import { AuthField } from '../components/auth/AuthField.jsx'
import { SubmitButton } from '../components/auth/SubmitButton.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { ApiError, getApiErrorMessage } from '../services/apiClient.js'
import { verifyCertificateCode } from '../services/certificateApi.js'

const CERTIFICATE_CODE_PATTERN = /^[A-Z0-9]{20}$/
const issueDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })

function normalizeCertificateCode(value) {
  return value.trim().toUpperCase()
}

function validateCertificateCode(value, t) {
  if (!value) {
    return t('certificateVerification.validation.required')
  }

  if (!CERTIFICATE_CODE_PATTERN.test(value)) {
    return t('certificateVerification.validation.format')
  }

  return ''
}

function getVerificationErrorMessage(error, t) {
  if (
    error instanceof ApiError &&
    (error.status === 404 || error.code === 'CERTIFICATE_NOT_FOUND')
  ) {
    return t('certificateVerification.errors.notFound')
  }

  return getApiErrorMessage(error, t('certificateVerification.errors.submit'))
}

function formatIssueDate(value, t) {
  if (!value) return t('common.dateUnavailable')

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? t('common.dateUnavailable')
    : issueDateFormatter.format(date)
}

function VerificationResult({ verification }) {
  const { t } = useTranslation()

  if (!verification?.valid) {
    return null
  }

  return (
    <section
      aria-labelledby="verification-result-title"
      className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/10"
      role="status"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-lg text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"
        >
          &#10003;
        </span>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase dark:text-emerald-300">
            {t('certificateVerification.result.eyebrow')}
          </p>
          <h2
            className="mt-1 font-semibold text-slate-950 dark:text-white"
            id="verification-result-title"
          >
            {t('certificateVerification.result.title')}
          </h2>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-emerald-200 rounded-xl border border-emerald-200 bg-white/70 px-4 dark:divide-emerald-300/10 dark:border-emerald-300/10 dark:bg-slate-950/25">
        <div className="py-3">
          <dt className="text-xs font-medium tracking-wide text-slate-600 uppercase dark:text-slate-400">
            {t('certificateVerification.result.student')}
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
            {verification.studentName}
          </dd>
        </div>
        <div className="py-3">
          <dt className="text-xs font-medium tracking-wide text-slate-600 uppercase dark:text-slate-400">
            {t('certificateVerification.result.exam')}
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
            {verification.examTitle}
          </dd>
        </div>
        <div className="py-3">
          <dt className="text-xs font-medium tracking-wide text-slate-600 uppercase dark:text-slate-400">
            {t('certificateVerification.result.issuedOn')}
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
            {formatIssueDate(verification.issuedAt, t)}
          </dd>
        </div>
      </dl>
    </section>
  )
}

export function CertificateVerificationPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('certificateVerification.documentTitle'))

  const [certificateCode, setCertificateCode] = useState('')
  const [certificateCodeError, setCertificateCodeError] = useState('')
  const verificationMutation = useMutation({ mutationFn: verifyCertificateCode })

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedCode = normalizeCertificateCode(certificateCode)
    const validationMessage = validateCertificateCode(normalizedCode, t)

    if (validationMessage) {
      verificationMutation.reset()
      setCertificateCodeError(validationMessage)
      return
    }

    setCertificateCode(normalizedCode)
    setCertificateCodeError('')
    verificationMutation.mutate(normalizedCode)
  }

  return (
    <AuthCard
      description={t('certificateVerification.description')}
      footer={
        <Link
          className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-100 font-semibold"
          to="/"
        >
          {t('certificateVerification.returnHome')}
        </Link>
      }
      title={t('certificateVerification.title')}
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoCapitalize="characters"
          autoComplete="off"
          disabled={verificationMutation.isPending}
          error={certificateCodeError}
          helperText={t('certificateVerification.codeHint')}
          id="certificate-code"
          label={t('certificateVerification.codeLabel')}
          maxLength={20}
          name="certificateCode"
          onChange={(event) => {
            setCertificateCode(event.target.value.toUpperCase())
            setCertificateCodeError('')
            verificationMutation.reset()
          }}
          placeholder={t('certificateVerification.codePlaceholder')}
          required
          spellCheck="false"
          type="text"
          value={certificateCode}
        />

        {verificationMutation.isError ? (
          <AuthError message={getVerificationErrorMessage(verificationMutation.error, t)} />
        ) : null}

        <SubmitButton
          isLoading={verificationMutation.isPending}
          loadingLabel={t('certificateVerification.verifying')}
        >
          {t('certificateVerification.submit')}
        </SubmitButton>

        <VerificationResult verification={verificationMutation.data} />
      </form>
    </AuthCard>
  )
}
