import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../../services/apiClient.js'
import {
  getValidationErrors,
  normalizeEmail,
  validateEmail,
  validateName,
} from '../../../utils/authValidation.js'

const INITIAL_VALUES = { email: '', name: '' }

export function ManagedUserCreateForm({ entityLabel, isPending, onCreate }) {
  const { t } = useTranslation()
  const [values, setValues] = useState(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

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
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFormError('')

    try {
      await onCreate({
        email: normalizeEmail(values.email),
        name: values.name.trim().replace(/\s+/g, ' '),
      })
      setValues(INITIAL_VALUES)
      setFieldErrors({})
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          t('admin.users.errors.create', { entity: entityLabel.toLowerCase() }),
        ),
      )
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-6 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/20">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          {t('admin.users.createTitle', { entity: entityLabel })}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {t('admin.users.passwordEmail')}
        </p>
      </div>

      {formError ? (
        <div
          aria-live="polite"
          className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      <form
        className="grid gap-4 lg:grid-cols-[1fr_1.25fr_auto] lg:items-start"
        noValidate
        onSubmit={handleSubmit}
      >
        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            htmlFor={`new-${entityLabel.toLowerCase()}-name`}
          >
            {t('auth.fields.fullName')}
          </label>
          <input
            aria-describedby={
              fieldErrors.name ? `new-${entityLabel.toLowerCase()}-name-error` : undefined
            }
            aria-invalid={Boolean(fieldErrors.name)}
            autoComplete="name"
            className="focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 transition outline-none placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-600"
            disabled={isPending}
            id={`new-${entityLabel.toLowerCase()}-name`}
            maxLength={100}
            name="name"
            onChange={updateField}
            placeholder={t('auth.fields.fullName')}
            required
            value={values.name}
          />
          {fieldErrors.name ? (
            <p
              className="mt-1.5 text-sm text-rose-700 dark:text-rose-300"
              id={`new-${entityLabel.toLowerCase()}-name-error`}
            >
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            htmlFor={`new-${entityLabel.toLowerCase()}-email`}
          >
            {t('auth.fields.email')}
          </label>
          <input
            aria-describedby={
              fieldErrors.email ? `new-${entityLabel.toLowerCase()}-email-error` : undefined
            }
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
            className="focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 transition outline-none placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-600"
            disabled={isPending}
            id={`new-${entityLabel.toLowerCase()}-email`}
            inputMode="email"
            maxLength={254}
            name="email"
            onChange={updateField}
            placeholder={t('admin.users.emailPlaceholder')}
            required
            type="email"
            value={values.email}
          />
          {fieldErrors.email ? (
            <p
              className="mt-1.5 text-sm text-rose-700 dark:text-rose-300"
              id={`new-${entityLabel.toLowerCase()}-email-error`}
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <button
          className="bg-brand-500 hover:bg-brand-400 focus:ring-brand-500/30 mt-0 rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap text-white transition focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 lg:mt-7"
          disabled={isPending}
          type="submit"
        >
          {isPending
            ? t('admin.users.creating')
            : t('admin.users.createTitle', { entity: entityLabel })}
        </button>
      </form>
    </section>
  )
}
