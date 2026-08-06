import { useTranslation } from 'react-i18next'

function AnswerValue({ emptyLabel, value }) {
  const normalizedValue = typeof value === 'string' ? value.trim() : value

  if (normalizedValue === null || normalizedValue === undefined || normalizedValue === '') {
    return <span className="text-slate-500 italic dark:text-slate-400">{emptyLabel}</span>
  }

  return <span className="whitespace-pre-wrap">{normalizedValue}</span>
}

function getStudentAnswer(question) {
  return question.selectedOption?.text ?? question.answerText
}

function getCorrectAnswer(question) {
  return question.correctOption?.text ?? question.correctAnswerText
}

export function ResultQuestionCard({ question }) {
  const { t } = useTranslation()
  const isCorrect = question.isCorrect === true
  const hasPartialCredit =
    !isCorrect && Number(question.marksAwarded) > 0 && Number.isFinite(Number(question.maxMarks))
  const questionNumber = Number.isInteger(question.order)
    ? question.order + 1
    : t('student.common.notAvailable')
  const outcomeLabel = isCorrect
    ? t('student.result.question.correct')
    : hasPartialCredit
      ? t('student.result.question.partialCredit')
      : t('student.result.question.incorrect')

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/65 dark:shadow-none">
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
        <div>
          <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-[0.16em] uppercase">
            {t('student.result.question.heading', {
              number: questionNumber,
              type: t(`student.questionTypes.${question.type}`, {
                defaultValue: t('student.questionTypes.unknown'),
              }),
            })}
          </p>
          <h3 className="mt-2 font-semibold whitespace-pre-wrap text-slate-950 dark:text-white">
            {question.content}
          </h3>
        </div>
        <span
          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
            isCorrect
              ? 'border-emerald-500/35 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200'
              : hasPartialCredit
                ? 'border-amber-500/35 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200'
                : 'border-rose-500/35 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200'
          }`}
        >
          {outcomeLabel}
        </span>
      </header>

      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 dark:bg-slate-800">
        <section className="bg-slate-50 p-5 dark:bg-slate-950/55">
          <h4 className="text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
            {t('student.result.question.yourAnswer')}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-800 dark:text-slate-200">
            <AnswerValue
              emptyLabel={t('student.result.question.notAnswered')}
              value={getStudentAnswer(question)}
            />
          </p>
        </section>
        <section className="bg-slate-50 p-5 dark:bg-slate-950/55">
          <h4 className="text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
            {t('student.result.question.correctAnswer')}
          </h4>
          <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
            <AnswerValue
              emptyLabel={t('student.result.question.noReferenceAnswer')}
              value={getCorrectAnswer(question)}
            />
          </p>
        </section>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-3 text-sm dark:border-slate-800">
        <span className="text-slate-500 dark:text-slate-400">
          {t('student.result.question.marksAwarded')}
        </span>
        <span className="font-semibold text-slate-950 dark:text-white">
          {question.marksAwarded} / {question.maxMarks}
        </span>
      </footer>
    </article>
  )
}
