import { useState } from 'react'
import {
  EXAM_TYPES,
  formatExamType,
  getExamFormValues,
  validateExamForm,
} from '../../../utils/teacherExamValidation.js'

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60'

const securityFields = [
  {
    description: 'Randomize the order of questions for each attempt.',
    key: 'shuffleQuestions',
    label: 'Shuffle questions',
  },
  {
    description: 'Randomize answer options where the question supports it.',
    key: 'shuffleOptions',
    label: 'Shuffle options',
  },
  {
    description: 'Ask students to remain in full-screen mode.',
    key: 'fullScreenRequired',
    label: 'Require full screen',
  },
  {
    description: 'Enable the webcam requirement for this exam.',
    key: 'webcamMonitoring',
    label: 'Require webcam',
  },
]

export function ExamCreateForm({
  disabled = false,
  error,
  exam,
  isPending,
  mode = 'create',
  onCancel,
  onClearError,
  onSubmit,
  subjectIds,
}) {
  const [values, setValues] = useState(() => getExamFormValues(exam))
  const [validationError, setValidationError] = useState('')
  const formDisabled = disabled || isPending
  const isEditing = mode === 'edit'

  function updateField(event) {
    const { checked, name, type, value } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setValidationError('')
    onClearError()
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateExamForm(values)

    if (result.error) {
      setValidationError(result.error)
      return
    }

    onSubmit(result.payload)
  }

  const displayedError = validationError || error

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {displayedError ? (
        <div
          className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {displayedError}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-200 md:col-span-2">
          Exam title
          <input
            autoComplete="off"
            className={inputClassName}
            disabled={formDisabled}
            maxLength={200}
            minLength={3}
            name="title"
            onChange={updateField}
            placeholder="e.g. Algebra fundamentals quiz"
            required
            value={values.title}
          />
        </label>

        <label className="text-sm font-medium text-slate-200">
          Subject ID
          <input
            autoComplete="off"
            className={inputClassName}
            disabled={formDisabled}
            list="teacher-subject-id-options"
            name="subjectId"
            onChange={updateField}
            placeholder="Paste the subject ID"
            required
            value={values.subjectId}
          />
          <span className="mt-1.5 block text-xs font-normal text-slate-500">
            Use the ID of an existing subject assigned by an administrator.
          </span>
          <datalist id="teacher-subject-id-options">
            {subjectIds.map((subjectId) => (
              <option key={subjectId} value={subjectId} />
            ))}
          </datalist>
        </label>

        <label className="text-sm font-medium text-slate-200">
          Exam type
          <select
            className={inputClassName}
            disabled={formDisabled}
            name="type"
            onChange={updateField}
            value={values.type}
          >
            {EXAM_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatExamType(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-200">
          Duration (minutes)
          <input
            className={inputClassName}
            disabled={formDisabled}
            max="1440"
            min="1"
            name="durationMinutes"
            onChange={updateField}
            required
            step="1"
            type="number"
            value={values.durationMinutes}
          />
        </label>

        <label className="text-sm font-medium text-slate-200">
          Passing marks
          <input
            className={inputClassName}
            disabled={formDisabled}
            min="0"
            name="passingMarks"
            onChange={updateField}
            required
            step="1"
            type="number"
            value={values.passingMarks}
          />
          <span className="mt-1.5 block text-xs font-normal text-slate-500">
            You can attach questions and see the final total before publishing.
          </span>
        </label>

        <label className="text-sm font-medium text-slate-200">
          Allowed tab switches
          <input
            className={inputClassName}
            disabled={formDisabled}
            max="10000"
            min="0"
            name="tabSwitchLimit"
            onChange={updateField}
            placeholder="No limit"
            step="1"
            type="number"
            value={values.tabSwitchLimit}
          />
          <span className="mt-1.5 block text-xs font-normal text-slate-500">
            Leave blank for no configured limit; use 0 to allow none.
          </span>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-white">Security and delivery</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {securityFields.map((field) => (
            <label
              className="flex cursor-pointer gap-3 rounded-xl border border-slate-800 bg-slate-950/45 p-4"
              key={field.key}
            >
              <input
                checked={values[field.key]}
                className="mt-0.5 h-4 w-4 accent-sky-500"
                disabled={formDisabled}
                name={field.key}
                onChange={updateField}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-medium text-slate-200">{field.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {field.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-5">
        <button
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={formDisabled}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={formDisabled}
          type="submit"
        >
          {isPending
            ? isEditing
              ? 'Saving changes…'
              : 'Creating draft…'
            : isEditing
              ? 'Save changes'
              : 'Create draft'}
        </button>
      </div>
    </form>
  )
}
