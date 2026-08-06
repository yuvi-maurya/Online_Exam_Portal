import { useTranslation } from 'react-i18next'
import { AttemptSaveStatus } from './AttemptSaveStatus.jsx'
import { isChoiceQuestionType } from '../../../utils/studentAttempt.js'

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
  const { t } = useTranslation()
  const isChoiceQuestion = isChoiceQuestionType(question.type)
  const options = [...(question.options ?? [])].sort(
    (left, right) => Number(left.order ?? 0) - Number(right.order ?? 0),
  )

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900/55 dark:shadow-none">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
        <div>
          <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-[0.16em] uppercase">
            {t('student.attempt.question.position', { number, total })}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t(`student.questionTypes.${question.type}`, {
              defaultValue: t('student.questionTypes.unknown'),
            })}{' '}
            · {t('student.attempt.question.marks', { count: Number(question.marks) })}
          </p>
        </div>
        <AttemptSaveStatus onRetry={onRetrySave} status={saveStatus} />
      </header>

      <h2 className="mt-6 text-lg leading-8 font-semibold whitespace-pre-wrap text-slate-950 sm:text-xl dark:text-white">
        {question.content}
      </h2>

      {isChoiceQuestion ? (
        <fieldset className="mt-6 space-y-3" disabled={disabled}>
          <legend className="sr-only">{t('student.attempt.question.chooseOne')}</legend>
          {options.length > 0 ? (
            options.map((option, optionIndex) => {
              const checked = answer.selectedOptionId === option.id

              return (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    checked
                      ? 'border-brand-500/60 bg-brand-50 dark:border-brand-400/60 dark:bg-brand-500/10 text-slate-950 dark:text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-300 dark:hover:border-slate-700'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  key={option.id}
                >
                  <input
                    checked={checked}
                    className="text-brand-500 focus:ring-brand-400 mt-1 h-4 w-4 border-slate-400 bg-white dark:border-slate-600 dark:bg-slate-900"
                    name={`question-${question.id}`}
                    onChange={() =>
                      onAnswerChange({ questionId: question.id, selectedOptionId: option.id })
                    }
                    type="radio"
                    value={option.id}
                  />
                  <span className="min-w-0 leading-6 whitespace-pre-wrap">
                    <span className="mr-2 font-semibold text-slate-500 dark:text-slate-400">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    {option.text}
                  </span>
                </label>
              )
            })
          ) : (
            <p className="rounded-xl border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
              {t('student.attempt.question.optionsUnavailable')}
            </p>
          )}
        </fieldset>
      ) : question.type === 'FILL_BLANK' ? (
        <div className="mt-6">
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor={`answer-${question.id}`}
          >
            {t('student.attempt.question.yourAnswer')}
          </label>
          <input
            autoComplete="off"
            className="focus:border-brand-400 focus:ring-brand-400/20 mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 transition outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
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
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor={`answer-${question.id}`}
          >
            {t('student.attempt.question.yourAnswer')}
          </label>
          <textarea
            className="focus:border-brand-400 focus:ring-brand-400/20 mt-2 min-h-48 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 leading-6 text-slate-950 transition outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
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
