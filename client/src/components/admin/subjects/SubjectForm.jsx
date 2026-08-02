import { useState } from 'react'
import {
  buildSubjectPayload,
  validateSubjectValues,
} from '../../../utils/adminSubjectValidation.js'

function getInitialValues(subject) {
  return {
    code: subject?.code ?? '',
    description: subject?.description ?? '',
    name: subject?.name ?? '',
  }
}

function SubjectField({ error, id, label, ...inputProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        className="focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-3 text-sm text-white transition outline-none placeholder:text-slate-600 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
        id={id}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-rose-300" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function SubjectForm({ error, isPending, mode, onCancel, onClearError, onSubmit, subject }) {
  const [values, setValues] = useState(() => getInitialValues(subject))
  const [fieldErrors, setFieldErrors] = useState({})
  const isEditing = mode === 'edit'

  function updateField(event) {
    const { name, value } = event.target
    const nextValue = name === 'code' ? value.toUpperCase() : value

    setValues((current) => ({ ...current, [name]: nextValue }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    onClearError()
  }

  function handleSubmit(event) {
    event.preventDefault()
    const errors = validateSubjectValues(values)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    onSubmit(buildSubjectPayload(values))
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {error ? (
        <div
          className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <SubjectField
          autoComplete="off"
          disabled={isPending}
          error={fieldErrors.name}
          id={`${mode}-subject-name`}
          label="Subject name"
          name="name"
          onChange={updateField}
          placeholder="Computer Science"
          required
          value={values.name}
        />
        <SubjectField
          autoCapitalize="characters"
          autoComplete="off"
          disabled={isPending}
          error={fieldErrors.code}
          id={`${mode}-subject-code`}
          label="Subject code"
          name="code"
          onChange={updateField}
          placeholder="CS101"
          required
          spellCheck="false"
          value={values.code}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label
            className="block text-sm font-medium text-slate-200"
            htmlFor={`${mode}-description`}
          >
            Description <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <span className="text-xs text-slate-500">{values.description.trim().length}/2000</span>
        </div>
        <textarea
          aria-describedby={fieldErrors.description ? `${mode}-description-error` : undefined}
          aria-invalid={Boolean(fieldErrors.description)}
          className="focus:border-brand-400 focus:ring-brand-500/20 min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-3 text-sm text-white transition outline-none placeholder:text-slate-600 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          id={`${mode}-description`}
          name="description"
          onChange={updateField}
          placeholder="A short description of this subject"
          value={values.description}
        />
        {fieldErrors.description ? (
          <p className="mt-1.5 text-sm text-rose-300" id={`${mode}-description-error`}>
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <button
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending
            ? isEditing
              ? 'Saving changes\u2026'
              : 'Creating subject\u2026'
            : isEditing
              ? 'Save changes'
              : 'Create subject'}
        </button>
      </div>
    </form>
  )
}
