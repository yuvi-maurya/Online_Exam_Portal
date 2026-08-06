import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { formatSubjectLabel } from '../../../utils/teacherSubject.js'

const inputClassName =
  'focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 transition outline-none placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-600'

function FieldError({ children, id }) {
  return children ? (
    <p className="mt-1.5 text-sm text-rose-700 dark:text-rose-300" id={id}>
      {children}
    </p>
  ) : null
}

function FieldLabel({ children, htmlFor, optional = false }) {
  const { t } = useTranslation()

  return (
    <label
      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
      htmlFor={htmlFor}
    >
      {children}{' '}
      {optional ? (
        <span className="font-normal text-slate-500 dark:text-slate-400">
          {t('common.optional')}
        </span>
      ) : null}
    </label>
  )
}

function getAnswerLabel(type, t) {
  if (type === 'CODING') return t('teacher.questions.form.expectedSolution')
  if (type === 'ESSAY') return t('teacher.questions.form.referenceAnswer')
  if (type === 'FILL_BLANK') return t('teacher.questions.form.correctText')
  return t('teacher.questions.form.correctAnswer')
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
  const { t } = useTranslation()
  const isTrueFalse = type === 'TRUE_FALSE'

  return (
    <fieldset aria-describedby={error ? `${mode}-question-options-error` : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('teacher.questions.form.answerOptions')}
          </legend>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('teacher.questions.form.optionsDescription')}
          </p>
        </div>
        {!isTrueFalse ? (
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            disabled={disabled || options.length >= 100}
            onClick={onAdd}
            type="button"
          >
            {t('teacher.questions.form.addOption')}
          </button>
        ) : (
          <span className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
            {t('teacher.questions.form.twoOptionsRequired')}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {options.map((option, index) => (
          <div
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center dark:border-slate-800 dark:bg-slate-950/35"
            key={option.clientId}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                checked={option.isCorrect}
                className="accent-brand-500 h-4 w-4"
                disabled={disabled}
                name={`${mode}-correct-option`}
                onChange={() => onChange(option.clientId, 'isCorrect', true)}
                type="radio"
              />
              {t('teacher.questions.form.correct')}
            </label>
            <div>
              <label className="sr-only" htmlFor={`${mode}-question-option-${option.clientId}`}>
                {t('teacher.questions.form.optionLabel', { number: index + 1 })}
              </label>
              <input
                className={inputClassName}
                disabled={disabled}
                id={`${mode}-question-option-${option.clientId}`}
                maxLength={2000}
                onChange={(event) => onChange(option.clientId, 'text', event.target.value)}
                placeholder={t('teacher.questions.form.optionLabel', { number: index + 1 })}
                value={option.text}
              />
            </div>
            <div className="flex items-center justify-end gap-1">
              <button
                aria-label={t('teacher.questions.form.moveOptionUp', { number: index + 1 })}
                className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-700 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                disabled={disabled || index === 0}
                onClick={() => onMove(index, -1)}
                type="button"
              >
                {t('common.up')}
              </button>
              <button
                aria-label={t('teacher.questions.form.moveOptionDown', { number: index + 1 })}
                className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-700 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                disabled={disabled || index === options.length - 1}
                onClick={() => onMove(index, 1)}
                type="button"
              >
                {t('common.down')}
              </button>
              {!isTrueFalse ? (
                <button
                  aria-label={t('teacher.questions.form.removeOptionAria', { number: index + 1 })}
                  className="rounded-lg border border-rose-400 px-2.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  disabled={disabled || options.length <= 2}
                  onClick={() => onRemove(option.clientId)}
                  type="button"
                >
                  {t('common.remove')}
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
  subjects = [],
  subjectsLoading = false,
  subjectsUnavailable = false,
}) {
  const { t } = useTranslation()
  const [values, setValues] = useState(() => getInitialQuestionValues(question))
  const [fieldErrors, setFieldErrors] = useState({})
  const isEditing = mode === 'edit'
  const isChoice = CHOICE_QUESTION_TYPES.has(values.type)
  const subjectSelectionDisabled =
    isPending || subjectsLoading || subjectsUnavailable || subjects.length === 0

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
          className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <FieldLabel htmlFor={`${mode}-question-content`}>
            {t('teacher.questions.form.questionText')}
          </FieldLabel>
          <span className="text-xs text-slate-500 dark:text-slate-400">
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
          placeholder={t('teacher.questions.form.questionPlaceholder')}
          value={values.content}
        />
        <FieldError id={`${mode}-question-content-error`}>{fieldErrors.content}</FieldError>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <FieldLabel htmlFor={`${mode}-question-type`}>
            {t('teacher.questions.form.questionType')}
          </FieldLabel>
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
                {t(type.labelKey)}
              </option>
            ))}
          </select>
          <FieldError id={`${mode}-question-type-error`}>{fieldErrors.type}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${mode}-question-difficulty`}>{t('common.difficulty')}</FieldLabel>
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
                {t(difficulty.labelKey)}
              </option>
            ))}
          </select>
          <FieldError id={`${mode}-question-difficulty-error`}>{fieldErrors.difficulty}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${mode}-question-subject`}>{t('common.subject')}</FieldLabel>
          <select
            aria-describedby={fieldErrors.subjectId ? `${mode}-question-subject-error` : undefined}
            aria-invalid={Boolean(fieldErrors.subjectId)}
            className={inputClassName}
            disabled={subjectSelectionDisabled}
            id={`${mode}-question-subject`}
            name="subjectId"
            onChange={updateField}
            value={values.subjectId}
          >
            <option value="">
              {subjectsLoading
                ? t('common.loadingSubjects')
                : subjectsUnavailable
                  ? t('common.subjectsUnavailable')
                  : subjects.length === 0
                    ? t('common.noSubjectsAvailable')
                    : t('validation.common.subjectRequired')}
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {formatSubjectLabel(subject)}
              </option>
            ))}
          </select>
          <FieldError id={`${mode}-question-subject-error`}>{fieldErrors.subjectId}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={`${mode}-question-marks`}>
            {t('teacher.questions.form.defaultMarks')}
          </FieldLabel>
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
              {getAnswerLabel(values.type, t)}
            </FieldLabel>
            <span className="text-xs text-slate-500 dark:text-slate-400">
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
            placeholder={t('teacher.questions.form.answerPlaceholder')}
            value={values.correctAnswerText}
          />
          <FieldError id={`${mode}-question-correct-answer-error`}>
            {fieldErrors.correctAnswerText}
          </FieldError>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
        <button
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          disabled={isPending}
          onClick={onCancel}
          type="button"
        >
          {t('common.cancel')}
        </button>
        <button
          className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={subjectSelectionDisabled}
          type="submit"
        >
          {isPending
            ? isEditing
              ? t('teacher.questions.form.saving')
              : t('teacher.questions.form.creating')
            : isEditing
              ? t('common.saveChanges')
              : t('teacher.questions.form.create')}
        </button>
      </div>
    </form>
  )
}
