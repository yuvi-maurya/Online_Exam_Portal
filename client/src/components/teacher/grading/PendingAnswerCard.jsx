import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getApiErrorMessage } from '../../../services/apiClient.js'
import { gradeTeacherAnswer, teacherQueryKeys } from '../../../services/teacherApi.js'

function formatSubmittedAt(value) {
  if (!value) {
    return 'Submission time unavailable'
  }

  const submittedAt = new Date(value)
  return Number.isNaN(submittedAt.getTime())
    ? 'Submission time unavailable'
    : submittedAt.toLocaleString()
}

function getSubmittedAnswer(answer) {
  if (answer.answerText?.trim()) {
    return answer.answerText
  }

  if (answer.selectedOption?.text) {
    return answer.selectedOption.text
  }

  return 'No answer submitted.'
}

export function PendingAnswerCard({ answer, attempt, exam }) {
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
      setValidationMessage('Enter a valid mark.')
      return
    }

    if (marksAwarded < 0 || marksAwarded > maxMarks) {
      setValidationMessage(`Marks must be between 0 and ${maxMarks}.`)
      return
    }

    setValidationMessage('')
    gradeMutation.mutate(marksAwarded)
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-5 py-4 sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-brand-400 text-xs font-semibold tracking-wide uppercase">
            {exam.title}
          </p>
          <h2 className="mt-1 font-semibold text-white">{attempt.student.name}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {attempt.student.email} · {formatSubmittedAt(attempt.submittedAt)}
          </p>
        </div>
        <span className="mt-3 inline-flex rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200 sm:mt-0">
          {answer.questionType.replaceAll('_', ' ')} · {maxMarks} marks
        </span>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Question</p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-200">
              {answer.questionText}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Student answer
            </p>
            <p className="mt-2 max-h-64 overflow-auto text-sm leading-6 whitespace-pre-wrap text-slate-200">
              {getSubmittedAnswer(answer)}
            </p>
          </div>
          {answer.correctAnswerText ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-emerald-300/80 uppercase">
                Reference answer
              </p>
              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-emerald-100/80">
                {answer.correctAnswerText}
              </p>
            </div>
          ) : null}
        </div>

        <form
          className="self-start rounded-xl border border-slate-800 bg-slate-950/40 p-4"
          onSubmit={handleSubmit}
        >
          <label
            className="text-sm font-medium text-slate-200"
            htmlFor={`marks-${attempt.id}-${answer.questionId}`}
          >
            Marks awarded
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              className="focus:border-brand-400 focus:ring-brand-400/20 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white transition outline-none focus:ring-2"
              disabled={gradeMutation.isPending}
              id={`marks-${attempt.id}-${answer.questionId}`}
              max={maxMarks}
              min="0"
              onChange={(event) => {
                setMarks(event.target.value)
                setValidationMessage('')
              }}
              placeholder={`0–${maxMarks}`}
              step="any"
              type="number"
              value={marks}
            />
            <span className="shrink-0 text-sm text-slate-500">/ {maxMarks}</span>
          </div>
          {validationMessage ? (
            <p className="mt-2 text-xs text-rose-300" role="alert">
              {validationMessage}
            </p>
          ) : null}
          {gradeMutation.isError ? (
            <p className="mt-2 text-xs text-rose-300" role="alert">
              {getApiErrorMessage(gradeMutation.error, 'The mark could not be saved.')}
            </p>
          ) : null}
          <button
            className="bg-brand-500 hover:bg-brand-600 mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            disabled={gradeMutation.isPending}
            type="submit"
          >
            {gradeMutation.isPending ? 'Saving mark…' : 'Save mark'}
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Saving clears manual review for this answer. The attempt is finalized after its last
            answer is graded.
          </p>
        </form>
      </div>
    </article>
  )
}
