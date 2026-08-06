import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const inputClassName =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white'

function AddQuestionForm({ availableQuestions, disabled, isPending, nextOrder, onAttach }) {
  const { t } = useTranslation()
  const [questionId, setQuestionId] = useState('')
  const [marks, setMarks] = useState('')
  const [order, setOrder] = useState(String(nextOrder))
  const [error, setError] = useState('')

  function selectQuestion(event) {
    const value = event.target.value
    const question = availableQuestions.find((item) => item.id === value)
    setQuestionId(value)
    setMarks(question ? String(question.marks) : '')
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const marksNumber = Number(marks)
    const orderNumber = Number(order)

    if (!questionId) {
      setError(t('teacher.exams.builder.validation.questionRequired'))
      return
    }

    if (!Number.isInteger(marksNumber) || marksNumber < 1) {
      setError(t('teacher.exams.builder.validation.marks'))
      return
    }

    if (!Number.isInteger(orderNumber) || orderNumber < 0) {
      setError(t('teacher.exams.builder.validation.order'))
      return
    }

    onAttach({ marks: marksNumber, order: orderNumber, questionId })
  }

  if (availableQuestions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-7 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
        {t('teacher.exams.builder.noAvailableQuestions')}
      </div>
    )
  }

  return (
    <form
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_8rem_8rem_auto] lg:items-end">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('common.question')}
          <select
            className={`mt-2 ${inputClassName}`}
            disabled={disabled}
            onChange={selectQuestion}
            value={questionId}
          >
            <option value="">{t('teacher.exams.builder.selectQuestion')}</option>
            {availableQuestions.map((question) => (
              <option key={question.id} value={question.id}>
                [{t(`questions.types.${question.type}`)}] {question.content}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('common.marks')}
          <input
            className={`mt-2 ${inputClassName}`}
            disabled={disabled}
            min="1"
            onChange={(event) => {
              setMarks(event.target.value)
              setError('')
            }}
            required
            step="1"
            type="number"
            value={marks}
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('common.order')}
          <input
            className={`mt-2 ${inputClassName}`}
            disabled={disabled}
            min="0"
            onChange={(event) => {
              setOrder(event.target.value)
              setError('')
            }}
            required
            step="1"
            type="number"
            value={order}
          />
        </label>
        <button
          className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          type="submit"
        >
          {isPending ? t('teacher.exams.builder.attaching') : t('teacher.exams.builder.attach')}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
    </form>
  )
}

function AttachmentEditor({ attachment, disabled, editable, isPending, onDetach, onSave }) {
  const { t } = useTranslation()
  const [marks, setMarks] = useState(String(attachment.marks))
  const [order, setOrder] = useState(String(attachment.order))
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const marksNumber = Number(marks)
    const orderNumber = Number(order)

    if (!Number.isInteger(marksNumber) || marksNumber < 1) {
      setError(t('teacher.exams.builder.validation.marks'))
      return
    }

    if (!Number.isInteger(orderNumber) || orderNumber < 0) {
      setError(t('teacher.exams.builder.validation.order'))
      return
    }

    setError('')
    onSave(attachment.questionId, { marks: marksNumber, order: orderNumber })
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/45">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {t(`questions.types.${attachment.question.type}`)}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {t(`questions.difficulties.${attachment.question.difficulty}`)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-slate-800 dark:text-slate-200">
            {attachment.question.content}
          </p>
        </div>

        {editable ? (
          <form
            className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-[6.5rem_6.5rem_auto_auto] sm:items-end"
            onSubmit={submit}
          >
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('common.marks')}
              <input
                className={`mt-1.5 ${inputClassName}`}
                disabled={disabled}
                min="1"
                onChange={(event) => {
                  setMarks(event.target.value)
                  setError('')
                }}
                step="1"
                type="number"
                value={marks}
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('common.order')}
              <input
                className={`mt-1.5 ${inputClassName}`}
                disabled={disabled}
                min="0"
                onChange={(event) => {
                  setOrder(event.target.value)
                  setError('')
                }}
                step="1"
                type="number"
                value={order}
              />
            </label>
            <button
              className="rounded-lg border border-sky-400 px-3 py-2.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-500/30 dark:text-sky-200 dark:hover:bg-sky-500/10"
              disabled={disabled}
              type="submit"
            >
              {isPending ? t('common.saving') : t('common.save')}
            </button>
            <button
              className="rounded-lg border border-rose-400 px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-200 dark:hover:bg-rose-500/10"
              disabled={disabled}
              onClick={() => onDetach(attachment)}
              type="button"
            >
              {t('common.remove')}
            </button>
          </form>
        ) : (
          <dl className="grid shrink-0 grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-900">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('common.marks')}</dt>
              <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                {attachment.marks}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-900">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('common.order')}</dt>
              <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                {attachment.order}
              </dd>
            </div>
          </dl>
        )}
      </div>
      {error ? (
        <p className="mt-2 text-right text-xs text-rose-700 dark:text-rose-300">{error}</p>
      ) : null}
    </li>
  )
}

export function ExamQuestionBuilder({
  attachments,
  availableQuestions,
  editable = true,
  error,
  isLoadingQuestions,
  interactionDisabled = false,
  mutation,
  onAttach,
  onDetach,
  onRetryQuestions,
  onSave,
  questionsError,
  totalMarks,
}) {
  const { t } = useTranslation()
  const nextOrder = attachments.reduce(
    (highest, attachment) => Math.max(highest, attachment.order + 1),
    0,
  )
  const builderDisabled = Boolean(mutation) || interactionDisabled

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t('teacher.exams.builder.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {editable
              ? t('teacher.exams.builder.description')
              : t('teacher.exams.builder.readOnlyDescription')}
          </p>
        </div>
        <div className="border-brand-500/25 bg-brand-500/10 rounded-xl border px-4 py-2 text-right">
          <p className="text-brand-700 dark:text-brand-400 text-xs font-medium">
            {t('teacher.exams.builder.runningTotal')}
          </p>
          <p className="text-xl font-bold text-slate-950 dark:text-white">
            {t('teacher.exams.builder.markCount', { count: totalMarks })}
          </p>
        </div>
      </div>

      {error ? (
        <div
          className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!editable ? null : isLoadingQuestions ? (
        <div
          className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950/45"
          aria-label={t('teacher.exams.builder.loadingQuestionBank')}
        />
      ) : questionsError ? (
        <div
          className="rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-500/25 dark:bg-rose-500/10"
          role="alert"
        >
          <p className="text-sm text-rose-700 dark:text-rose-100">{questionsError}</p>
          <button
            className="mt-3 rounded-lg border border-rose-400 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:text-rose-100 dark:hover:bg-rose-500/10"
            onClick={onRetryQuestions}
            type="button"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      ) : (
        <AddQuestionForm
          availableQuestions={availableQuestions}
          disabled={builderDisabled}
          isPending={mutation?.kind === 'attach'}
          key={`${attachments.length}-${nextOrder}`}
          nextOrder={nextOrder}
          onAttach={onAttach}
        />
      )}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t('teacher.exams.builder.attachedCount', { count: attachments.length })}
        </h3>
        {attachments.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-6 text-center text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-100/80">
            {t('teacher.exams.builder.noAttachments')}
          </div>
        ) : (
          <ol className="mt-3 space-y-3">
            {attachments.map((attachment) => (
              <AttachmentEditor
                attachment={attachment}
                disabled={builderDisabled}
                editable={editable}
                isPending={
                  mutation?.kind === 'update' && mutation.questionId === attachment.questionId
                }
                key={`${attachment.questionId}-${attachment.marks}-${attachment.order}`}
                onDetach={onDetach}
                onSave={onSave}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
