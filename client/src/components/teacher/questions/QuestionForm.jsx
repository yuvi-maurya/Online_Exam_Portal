import { useState } from 'react'
import {
  CHOICE_QUESTION_TYPES,
  QUESTION_DIFFICULTIES,
  QUESTION_TYPES,
  addQuestionOption,
  buildQuestionPayload,
  createDefaultChoiceOptions,
  getInitialQuestionValues,
  moveQuestionOption,
  removeQuestionOption,
  validateQuestionValues,
} from '../../../utils/teacherQuestionValidation.js'

const inputClassName =
  'focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-3 text-sm text-white transition outline-none placeholder:text-slate-600 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60'

function FieldError({ children, id }) {
  return children ? (
    <p className="mt-1.5 text-sm text-rose-300" id={id}>
      {children}
    </p>
  ) : null
}

function FieldLabel({ children, htmlFor, optional = false }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor={htmlFor}>
      {children} {optional ? <span className="font-normal text-slate-500">(optional)</span> : null}
    </label>
  )
}

function getAnswerLabel(type) {
  if (type === 'CODING') return 'Expected solution or reference answer'
  if (type === 'ESSAY') return 'Reference answer'
  if (type === 'FILL_BLANK') return 'Correct text'
  return 'Correct answer'
}

function QuestionOptionsEditor({
  disabled,
  error,
  mode,
  onAdd,
  onChange,
  onMove,
  onRemove,
  options,
  type,
}) {
  const isTrueFalse = type === 'TRUE_FALSE'

  return (
    <fieldset aria-describedby={error ? `${mode}-question-options-error` : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <legend className="text-sm font-medium text-slate-200">Answer options</legend>
          <p className="mt-1 text-xs text-slate-500">
            Select the correct answer. The displayed order is saved with the question.
          </p>
        </div>
        {!isTrueFalse ? (
          <button
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || options.length >= 100}
            onClick={onAdd}
            type="button"
          >
            Add option
          </button>
        ) : (
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
            Exactly two options required
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {options.map((option, index) => (
          <div
            className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/35 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            key={option.clientId}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <input
                checked={option.isCorrect}
                className="accent-brand-500 h-4 w-4"
                disabled={disabled}
                name={`${mode}-correct-option`}
                onChange={() => onChange(option.clientId, 'isCorrect', true)}
                type="radio"
              />
              Correct
            </label>
            <div>
              <label className="sr-only" htmlFor={`${mode}-question-option-${option.clientId}`}>
                Option {index + 1}
              </label>
              <input
                className={inputClassName}
                disabled={disabled}
                id={`${mode}-question-option-${option.clientId}`}
                maxLength={2000}
                onChange={(event) => onChange(option.clientId, 'text', event.target.value)}
                placeholder={`Option ${index + 1}`}
                value={option.text}
              />
            </div>
            <div className="flex items-center justify-end gap-1">
              <button
                aria-label={`Move option ${index + 1} up`}
                className="rounded-lg border border-slate-700 px-2.5 py-2 text-xs text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                disabled={disabled || index === 0}
                onClick={() => onMove(index, -1)}
                type="button"
              >
                Up
              </button>
              <button
                aria-label={`Move option ${index + 1} down`}
                className="rounded-lg border border-slate-700 px-2.5 py-2 text-xs text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                disabled={disabled || index === options.length - 1}
                onClick={() => onMove(index, 1)}
                type="button"
              >
                Down
              </button>
              {!isTrueFalse ? (
                <button
                  aria-label={`Remove option ${index + 1}`}
                  className="rounded-lg border border-rose-500/30 px-2.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                  disabled={disabled || options.length <= 2}
                  onClick={() => onRemove(option.clientId)}
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <FieldError id={`${mode}-question-options-error`}>{error}</FieldError>
    </fieldset>
  )
}

export function QuestionForm({
  error,
  isPending,
  mode,
  onCancel,
  onClearError,
  onSubmit,
  question,
  subjectIds = [],
}) {
  const [values, setValues] = useState(() => getInitialQuestionValues(question))
  const [fieldErrors, setFieldErrors] = useState({})
  const isEditing = mode === 'edit'
  const isChoice = CHOICE_QUESTION_TYPES.has(values.type)

  function clearFieldError(field) {
    setFieldErrors((current) => ({ ...current, [field]: '' }))
    onClearError()
  }

  function updateField(event) {
    const { name, value } = event.target

    if (name === 'type') {
      setValues((current) => ({
        ...current,
        correctAnswerText: CHOICE_QUESTION_TYPES.has(value) ? '' : current.correctAnswerText,
        options: CHOICE_QUESTION_TYPES.has(value)
          ? value === 'TRUE_FALSE'
            ? createDefaultChoiceOptions(value)
            : CHOICE_QUESTION_TYPES.has(current.type)
              ? current.options
              : createDefaultChoiceOptions(value)
          : [],
        type: value,
      }))
      setFieldErrors({})
      onClearError()
      return
    }

    setValues((current) => ({ ...current, [name]: value }))
    clearFieldError(name)
  }

  function updateOption(clientId, field, value) {
    setValues((current) => ({
      ...current,
      options: current.options.map((option) => {
        if (field === 'isCorrect') {
          return { ...option, isCorrect: option.clientId === clientId }
        }

        return option.clientId === clientId ? { ...option, [field]: value } : option
      }),
    }))
    clearFieldError('options')
  }

  function removeOption(clientId) {
    setValues((current) => {
      const options = removeQuestionOption(current.options, clientId)

      if (!options.some((option) => option.isCorrect) && options.length > 0) {
        options[0] = { ...options[0], isCorrect: true }
      }

      return { ...current, options }
    })
    clearFieldError('options')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const errors = validateQuestionValues(values)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    onSubmit(buildQuestionPayload(values))
  }

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit}>
      {error ? (
        <div
          className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <FieldLabel htmlFor={`${mode}-question-content`}>Question text</FieldLabel>
          <span className="text-xs text-slate-500">
            {values.content.trim().length.toLocaleString()}/20,000
          </span>
        </div>
        <textarea
          aria-describedby={fieldErrors.content ? `${mode}-question-content-error` : undefined}
          aria-invalid={Boolean(fieldErrors.content)}
          className={`${inputClassName} min-h-32 resize-y`}
          disabled={isPending}
          id={`${mode}-question-content`}
          maxLength={20000}
          name="content"
          onChange={updateField}
          placeholder="Enter the complete question prompt"
          value={values.content}
        />
        <FieldError id={`${mode}-question-content-error`}>{fieldErrors.content}</FieldError>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <FieldLabel htmlFor={`${mode}-question-type`}>Question type</FieldLabel>
          <select
            aria-invalid={Boolean(fieldErrors.type)}
            className={inputClassName}
            disabled={isPending}
            id={`${mode}-question-type`}
            name="type"
            onChange={updateField}
            value={values.type}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <FieldError id={`${mode}-question-type-error`}>{fieldErrors.type}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${mode}-question-difficulty`}>Difficulty</FieldLabel>
          <select
            aria-invalid={Boolean(fieldErrors.difficulty)}
            className={inputClassName}
            disabled={isPending}
            id={`${mode}-question-difficulty`}
            name="difficulty"
            onChange={updateField}
            value={values.difficulty}
          >
            {QUESTION_DIFFICULTIES.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
          <FieldError id={`${mode}-question-difficulty-error`}>{fieldErrors.difficulty}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${mode}-question-subject`}>Subject ID</FieldLabel>
          <input
            aria-describedby={fieldErrors.subjectId ? `${mode}-question-subject-error` : undefined}
            aria-invalid={Boolean(fieldErrors.subjectId)}
            autoComplete="off"
            className={inputClassName}
            disabled={isPending}
            id={`${mode}-question-subject`}
            list={`${mode}-question-subjects`}
            maxLength={100}
            name="subjectId"
            onChange={updateField}
            placeholder="Subject record ID"
            value={values.subjectId}
          />
          <datalist id={`${mode}-question-subjects`}>
            {subjectIds.map((subjectId) => (
              <option key={subjectId} value={subjectId} />
            ))}
          </datalist>
          <FieldError id={`${mode}-question-subject-error`}>{fieldErrors.subjectId}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${mode}-question-marks`}>Default marks</FieldLabel>
          <input
            aria-describedby={fieldErrors.marks ? `${mode}-question-marks-error` : undefined}
            aria-invalid={Boolean(fieldErrors.marks)}
            className={inputClassName}
            disabled={isPending}
            id={`${mode}-question-marks`}
            inputMode="numeric"
            max={1000000}
            min={1}
            name="marks"
            onChange={updateField}
            step={1}
            type="number"
            value={values.marks}
          />
          <FieldError id={`${mode}-question-marks-error`}>{fieldErrors.marks}</FieldError>
        </div>
      </div>

      {isChoice ? (
        <QuestionOptionsEditor
          disabled={isPending}
          error={fieldErrors.options}
          mode={mode}
          onAdd={() => {
            setValues((current) => ({
              ...current,
              options: addQuestionOption(current.options),
            }))
            clearFieldError('options')
          }}
          onChange={updateOption}
          onMove={(index, direction) => {
            setValues((current) => ({
              ...current,
              options: moveQuestionOption(current.options, index, direction),
            }))
            clearFieldError('options')
          }}
          onRemove={removeOption}
          options={values.options}
          type={values.type}
        />
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <FieldLabel htmlFor={`${mode}-question-correct-answer`}>
              {getAnswerLabel(values.type)}
            </FieldLabel>
            <span className="text-xs text-slate-500">
              {values.correctAnswerText.trim().length.toLocaleString()}/20,000
            </span>
          </div>
          <textarea
            aria-describedby={
              fieldErrors.correctAnswerText ? `${mode}-question-correct-answer-error` : undefined
            }
            aria-invalid={Boolean(fieldErrors.correctAnswerText)}
            className={`${inputClassName} min-h-28 resize-y`}
            disabled={isPending}
            id={`${mode}-question-correct-answer`}
            maxLength={20000}
            name="correctAnswerText"
            onChange={updateField}
            placeholder="Enter the answer teachers will use as the grading reference"
            value={values.correctAnswerText}
          />
          <FieldError id={`${mode}-question-correct-answer-error`}>
            {fieldErrors.correctAnswerText}
          </FieldError>
        </div>
      )}

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
              ? 'Saving question…'
              : 'Creating question…'
            : isEditing
              ? 'Save changes'
              : 'Create question'}
        </button>
      </div>
    </form>
  )
}
