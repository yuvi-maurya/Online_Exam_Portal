function formatQuestionType(type) {
  return type ? type.replaceAll('_', ' ') : 'Question'
}

function AnswerValue({ emptyLabel, value }) {
  const normalizedValue = typeof value === 'string' ? value.trim() : value

  if (normalizedValue === null || normalizedValue === undefined || normalizedValue === '') {
    return <span className="text-slate-500 italic">{emptyLabel}</span>
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
  const isCorrect = question.isCorrect === true
  const hasPartialCredit =
    !isCorrect && Number(question.marksAwarded) > 0 && Number.isFinite(Number(question.maxMarks))
  const questionNumber = Number.isInteger(question.order) ? question.order + 1 : '—'
  const outcomeLabel = isCorrect ? 'Correct' : hasPartialCredit ? 'Partial credit' : 'Incorrect'

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65">
      <header className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-brand-400 text-xs font-semibold tracking-[0.16em] uppercase">
            Question {questionNumber} · {formatQuestionType(question.type)}
          </p>
          <h3 className="mt-2 font-semibold whitespace-pre-wrap text-white">{question.content}</h3>
        </div>
        <span
          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
            isCorrect
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : hasPartialCredit
                ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                : 'border-rose-400/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          {outcomeLabel}
        </span>
      </header>

      <div className="grid gap-px bg-slate-800 sm:grid-cols-2">
        <section className="bg-slate-950/55 p-5">
          <h4 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Your answer
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            <AnswerValue emptyLabel="Not answered" value={getStudentAnswer(question)} />
          </p>
        </section>
        <section className="bg-slate-950/55 p-5">
          <h4 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Correct answer
          </h4>
          <p className="mt-2 text-sm leading-6 text-emerald-200">
            <AnswerValue
              emptyLabel="No reference answer was provided"
              value={getCorrectAnswer(question)}
            />
          </p>
        </section>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-slate-800 px-5 py-3 text-sm">
        <span className="text-slate-500">Marks awarded</span>
        <span className="font-semibold text-white">
          {question.marksAwarded} / {question.maxMarks}
        </span>
      </footer>
    </article>
  )
}
