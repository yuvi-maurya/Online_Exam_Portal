import { useState } from 'react'
import { getApiErrorMessage } from '../../../services/apiClient.js'
import {
  getValidationErrors,
  normalizeEmail,
  validateEmail,
  validateName,
} from '../../../utils/authValidation.js'

const INITIAL_VALUES = { email: '', name: '' }

export function ManagedUserCreateForm({ entityLabel, isPending, onCreate }) {
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
      setFormError(getApiErrorMessage(error, `Unable to create the ${entityLabel.toLowerCase()}.`))
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-slate-950/20 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Add {entityLabel}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          They will receive an email with instructions to set their own password.
        </p>
      </div>

      {formError ? (
        <div
          aria-live="polite"
          className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
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
            className="mb-2 block text-sm font-medium text-slate-200"
            htmlFor={`new-${entityLabel.toLowerCase()}-name`}
          >
            Full name
          </label>
          <input
            aria-describedby={
              fieldErrors.name ? `new-${entityLabel.toLowerCase()}-name-error` : undefined
            }
            aria-invalid={Boolean(fieldErrors.name)}
            autoComplete="name"
            className="focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-3 text-sm text-white transition outline-none placeholder:text-slate-600 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            id={`new-${entityLabel.toLowerCase()}-name`}
            maxLength={100}
            name="name"
            onChange={updateField}
            placeholder="Full name"
            required
            value={values.name}
          />
          {fieldErrors.name ? (
            <p
              className="mt-1.5 text-sm text-rose-300"
              id={`new-${entityLabel.toLowerCase()}-name-error`}
            >
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-200"
            htmlFor={`new-${entityLabel.toLowerCase()}-email`}
          >
            Email address
          </label>
          <input
            aria-describedby={
              fieldErrors.email ? `new-${entityLabel.toLowerCase()}-email-error` : undefined
            }
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
            className="focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-3 text-sm text-white transition outline-none placeholder:text-slate-600 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            id={`new-${entityLabel.toLowerCase()}-email`}
            inputMode="email"
            maxLength={254}
            name="email"
            onChange={updateField}
            placeholder="name@example.com"
            required
            type="email"
            value={values.email}
          />
          {fieldErrors.email ? (
            <p
              className="mt-1.5 text-sm text-rose-300"
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
          {isPending ? 'Creating…' : `Add ${entityLabel}`}
        </button>
      </form>
    </section>
  )
}
