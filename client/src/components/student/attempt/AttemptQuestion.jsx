import { AttemptSaveStatus } from './AttemptSaveStatus.jsx'
import { isChoiceQuestionType } from '../../../utils/studentAttempt.js'

function formatQuestionType(type) {
  return String(type ?? '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function AttemptQuestion({
  answer,
  disabled,
  number,
  onAnswerChange,
  onRetrySave,
  question,
  saveStatus,
  total,
}) {
  const isChoiceQuestion = isChoiceQuestionType(question.type)
  const options = [...(question.options ?? [])].sort(
    (left, right) => Number(left.order ?? 0) - Number(right.order ?? 0),
  )

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-7">
      <header className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-brand-400 text-xs font-semibold tracking-[0.16em] uppercase">
            Question {number} of {total}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {formatQuestionType(question.type)} \u00b7 {question.marks}{' '}
            {Number(question.marks) === 1 ? 'mark' : 'marks'}
          </p>
        </div>
        <AttemptSaveStatus onRetry={onRetrySave} status={saveStatus} />
      </header>

      <h2 className="mt-6 text-lg leading-8 font-semibold whitespace-pre-wrap text-white sm:text-xl">
        {question.content}
      </h2>

      {isChoiceQuestion ? (
        <fieldset className="mt-6 space-y-3" disabled={disabled}>
          <legend className="sr-only">Choose one answer</legend>
          {options.length > 0 ? (
            options.map((option, optionIndex) => {
              const checked = answer.selectedOptionId === option.id

              return (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    checked
                      ? 'border-brand-400/60 bg-brand-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/45 text-slate-300 hover:border-slate-700'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  key={option.id}
                >
                  <input
                    checked={checked}
                    className="text-brand-500 focus:ring-brand-400 mt-1 h-4 w-4 border-slate-600 bg-slate-900"
                    name={`question-${question.id}`}
                    onChange={() =>
                      onAnswerChange({ questionId: question.id, selectedOptionId: option.id })
                    }
                    type="radio"
                    value={option.id}
                  />
                  <span className="min-w-0 leading-6 whitespace-pre-wrap">
                    <span className="mr-2 font-semibold text-slate-500">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    {option.text}
                  </span>
                </label>
              )
            })
          ) : (
            <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
              No answer options were provided for this question. Contact your teacher before
              submitting.
            </p>
          )}
        </fieldset>
      ) : question.type === 'FILL_BLANK' ? (
        <div className="mt-6">
          <label
            className="block text-sm font-medium text-slate-300"
            htmlFor={`answer-${question.id}`}
          >
            Your answer
          </label>
          <input
            autoComplete="off"
            className="focus:border-brand-400 focus:ring-brand-400/20 mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white transition outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            id={`answer-${question.id}`}
            onChange={(event) =>
              onAnswerChange({ answerText: event.target.value, questionId: question.id })
            }
            value={answer.answerText}
          />
        </div>
      ) : (
        <div className="mt-6">
          <label
            className="block text-sm font-medium text-slate-300"
            htmlFor={`answer-${question.id}`}
          >
            Your answer
          </label>
          <textarea
            className="focus:border-brand-400 focus:ring-brand-400/20 mt-2 min-h-48 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 leading-6 text-white transition outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            id={`answer-${question.id}`}
            onChange={(event) =>
              onAnswerChange({ answerText: event.target.value, questionId: question.id })
            }
            spellCheck="true"
            value={answer.answerText}
          />
        </div>
      )}
    </article>
  )
}
