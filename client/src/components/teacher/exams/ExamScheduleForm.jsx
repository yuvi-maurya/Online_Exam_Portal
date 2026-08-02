import { useState } from 'react'
import { toDateTimeLocal, validateSchedule } from '../../../utils/teacherExamValidation.js'

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60'

export function ExamScheduleForm({
  disabled = false,
  exam,
  error,
  isPending,
  onClearError,
  onSubmit,
}) {
  const [start, setStart] = useState(toDateTimeLocal(exam.scheduledStart))
  const [end, setEnd] = useState(toDateTimeLocal(exam.scheduledEnd))
  const [validationError, setValidationError] = useState('')

  function updateStart(event) {
    setStart(event.target.value)
    setValidationError('')
    onClearError()
  }

  function updateEnd(event) {
    setEnd(event.target.value)
    setValidationError('')
    onClearError()
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateSchedule(start, end)

    if (result.error) {
      setValidationError(result.error)
      return
    }

    onSubmit(result.payload)
  }

  const displayedError = validationError || error

  return (
    <form onSubmit={handleSubmit}>
      {displayedError ? (
        <div
          className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {displayedError}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-200">
          Scheduled start
          <input
            className={inputClassName}
            disabled={disabled || isPending}
            onChange={updateStart}
            required
            type="datetime-local"
            value={start}
          />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Scheduled end
          <input
            className={inputClassName}
            disabled={disabled || isPending}
            onChange={updateEnd}
            required
            type="datetime-local"
            value={end}
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || isPending}
          type="submit"
        >
          {isPending
            ? 'Saving schedule…'
            : exam.scheduledStart
              ? 'Update schedule'
              : 'Set schedule'}
        </button>
      </div>
    </form>
  )
}
