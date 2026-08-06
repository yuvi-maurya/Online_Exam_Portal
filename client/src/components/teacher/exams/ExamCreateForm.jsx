import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  EXAM_TYPES,
  formatExamType,
  getExamFormValues,
  validateExamForm,
} from '../../../utils/teacherExamValidation.js'
import { formatSubjectLabel } from '../../../utils/teacherSubject.js'

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-600'

const securityFields = [
  {
    descriptionKey: 'teacher.exams.form.security.shuffleQuestionsDescription',
    key: 'shuffleQuestions',
    labelKey: 'teacher.exams.form.security.shuffleQuestions',
  },
  {
    descriptionKey: 'teacher.exams.form.security.shuffleOptionsDescription',
    key: 'shuffleOptions',
    labelKey: 'teacher.exams.form.security.shuffleOptions',
  },
  {
    descriptionKey: 'teacher.exams.form.security.fullScreenDescription',
    key: 'fullScreenRequired',
    labelKey: 'teacher.exams.form.security.fullScreen',
  },
  {
    descriptionKey: 'teacher.exams.form.security.webcamDescription',
    key: 'webcamMonitoring',
    labelKey: 'teacher.exams.form.security.webcam',
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
  subjects = [],
  subjectsLoading = false,
  subjectsUnavailable = false,
}) {
  const { t } = useTranslation()
  const [values, setValues] = useState(() => getExamFormValues(exam))
  const [validationError, setValidationError] = useState('')
  const formDisabled = disabled || isPending
  const isEditing = mode === 'edit'
  const subjectSelectionDisabled =
    formDisabled || subjectsLoading || subjectsUnavailable || subjects.length === 0

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
          className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100"
          role="alert"
        >
          {displayedError}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 md:col-span-2 dark:text-slate-200">
          {t('teacher.exams.form.title')}
          <input
            autoComplete="off"
            className={inputClassName}
            disabled={formDisabled}
            maxLength={200}
            minLength={3}
            name="title"
            onChange={updateField}
            placeholder={t('teacher.exams.form.titlePlaceholder')}
            required
            value={values.title}
          />
        </label>

        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('common.subject')}
          <select
            className={inputClassName}
            disabled={subjectSelectionDisabled}
            name="subjectId"
            onChange={updateField}
            required
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
        </label>

        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('teacher.exams.form.type')}
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

        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('teacher.exams.form.duration')}
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

        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('exam.fields.passingMarks')}
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
          <span className="mt-1.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
            {t('teacher.exams.form.passingMarksHint')}
          </span>
        </label>

        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('teacher.exams.form.allowedTabSwitches')}
          <input
            className={inputClassName}
            disabled={formDisabled}
            max="10000"
            min="0"
            name="tabSwitchLimit"
            onChange={updateField}
            placeholder={t('teacher.exams.form.noLimit')}
            step="1"
            type="number"
            value={values.tabSwitchLimit}
          />
          <span className="mt-1.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
            {t('teacher.exams.form.tabSwitchHint')}
          </span>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-950 dark:text-white">
          {t('teacher.exams.form.security.title')}
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {securityFields.map((field) => (
            <label
              className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/45"
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
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t(field.labelKey)}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {t(field.descriptionKey)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
        <button
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          disabled={formDisabled}
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
              ? t('common.savingChanges')
              : t('teacher.exams.form.creatingDraft')
            : isEditing
              ? t('common.saveChanges')
              : t('teacher.exams.form.createDraft')}
        </button>
      </div>
    </form>
  )
}
