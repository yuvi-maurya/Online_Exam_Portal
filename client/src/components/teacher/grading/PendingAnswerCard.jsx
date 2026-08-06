import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../../../services/apiClient.js'
import { gradeTeacherAnswer, teacherQueryKeys } from '../../../services/teacherApi.js'

function formatSubmittedAt(value, t, language) {
  if (!value) {
    return t('teacher.grading.submissionUnavailable')
  }

  const submittedAt = new Date(value)
  return Number.isNaN(submittedAt.getTime())
    ? t('teacher.grading.submissionUnavailable')
    : submittedAt.toLocaleString(language)
}

function getSubmittedAnswer(answer, t) {
  if (answer.answerText?.trim()) {
    return answer.answerText
  }

  if (answer.selectedOption?.text) {
    return answer.selectedOption.text
  }

  return t('teacher.grading.noAnswer')
}

export function PendingAnswerCard({ answer, attempt, exam }) {
  const { i18n, t } = useTranslation()
  const queryClient = useQueryClient()
  const [marks, setMarks] = useState(
    answer.marksAwarded === null || answer.marksAwarded === undefined
      ? ''
      : String(answer.marksAwarded),
  )
  const [validationMessage, setValidationMessage] = useState('')
  const maxMarks = Number(answer.maxMarks)
  const gradeMutation = useMutation({
    mutationFn: (marksAwarded) => gradeTeacherAnswer(attempt.id, answer.questionId, marksAwarded),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.pendingGrading(exam.id) }),
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.examReport(exam.id) }),
      ])
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    const marksAwarded = Number(marks)

    if (marks.trim() === '' || !Number.isFinite(marksAwarded)) {
      setValidationMessage(t('teacher.grading.validation.validMark'))
      return
    }

    if (marksAwarded < 0 || marksAwarded > maxMarks) {
      setValidationMessage(t('teacher.grading.validation.markRange', { maximum: maxMarks }))
      return
    }

    setValidationMessage('')
    gradeMutation.mutate(marksAwarded)
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <div className="border-b border-slate-200 px-5 py-4 sm:flex sm:items-start sm:justify-between sm:gap-4 dark:border-slate-800">
        <div>
          <p className="text-brand-700 dark:text-brand-400 text-xs font-semibold tracking-wide uppercase">
            {exam.title}
          </p>
          <h2 className="mt-1 font-semibold text-slate-950 dark:text-white">
            {attempt.student.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {attempt.student.email} · {formatSubmittedAt(attempt.submittedAt, t, i18n.language)}
          </p>
        </div>
        <span className="mt-3 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 sm:mt-0 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-200">
          {t(`questions.types.${answer.questionType}`)} ·{' '}
          {t('teacher.grading.markCount', { count: maxMarks })}
        </span>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {t('common.question')}
            </p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-800 dark:text-slate-200">
              {answer.questionText}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {t('teacher.grading.studentAnswer')}
            </p>
            <p className="mt-2 max-h-64 overflow-auto text-sm leading-6 whitespace-pre-wrap text-slate-800 dark:text-slate-200">
              {getSubmittedAnswer(answer, t)}
            </p>
          </div>
          {answer.correctAnswerText ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/5">
              <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300/80">
                {t('teacher.grading.referenceAnswer')}
              </p>
              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-emerald-800 dark:text-emerald-100/80">
                {answer.correctAnswerText}
              </p>
            </div>
          ) : null}
        </div>

        <form
          className="self-start rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
          onSubmit={handleSubmit}
        >
          <label
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
            htmlFor={`marks-${attempt.id}-${answer.questionId}`}
          >
            {t('teacher.grading.marksAwarded')}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              className="focus:border-brand-400 focus:ring-brand-400/20 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 transition outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              disabled={gradeMutation.isPending}
              id={`marks-${attempt.id}-${answer.questionId}`}
              max={maxMarks}
              min="0"
              onChange={(event) => {
                setMarks(event.target.value)
                setValidationMessage('')
              }}
              placeholder={t('teacher.grading.marksPlaceholder', { maximum: maxMarks })}
              step="any"
              type="number"
              value={marks}
            />
            <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
              / {maxMarks}
            </span>
          </div>
          {validationMessage ? (
            <p className="mt-2 text-xs text-rose-700 dark:text-rose-300" role="alert">
              {validationMessage}
            </p>
          ) : null}
          {gradeMutation.isError ? (
            <p className="mt-2 text-xs text-rose-700 dark:text-rose-300" role="alert">
              {getApiErrorMessage(gradeMutation.error, t('teacher.grading.errors.save'))}
            </p>
          ) : null}
          <button
            className="bg-brand-500 hover:bg-brand-600 mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            disabled={gradeMutation.isPending}
            type="submit"
          >
            {gradeMutation.isPending
              ? t('teacher.grading.savingMark')
              : t('teacher.grading.saveMark')}
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t('teacher.grading.saveExplanation')}
          </p>
        </form>
      </div>
    </article>
  )
}
