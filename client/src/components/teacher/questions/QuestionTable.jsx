const difficultyStyles = {
  EASY: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  HARD: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
  MEDIUM: 'border-amber-500/25 bg-amber-500/10 text-amber-200',
}

function formatLabel(value) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (character) => character.toUpperCase())
}

function QuestionAnswer({ question }) {
  if (question.options.length > 0) {
    const correctOption = question.options.find((option) => option.isCorrect)
    return correctOption?.text ?? 'No correct option'
  }

  return question.correctAnswerText || 'No reference answer'
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr className="border-t border-slate-800" key={index}>
      {Array.from({ length: 6 }, (__, column) => (
        <td className="px-4 py-5" key={column}>
          <span className="block h-4 animate-pulse rounded bg-slate-800" />
        </td>
      ))}
    </tr>
  ))
}

function QuestionPagination({ disabled, onPageChange, pagination }) {
  if (!pagination || pagination.total === 0) return null

  const start = (pagination.page - 1) * pagination.limit + 1
  const end = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate-400">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of{' '}
        {pagination.total.toLocaleString()} questions
      </p>
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          type="button"
        >
          Previous
        </button>
        <span className="min-w-24 text-center text-slate-400">
          Page {pagination.page} of {Math.max(1, pagination.totalPages)}
        </span>
        <button
          className="rounded-lg border border-slate-700 px-3 py-2 font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function QuestionTable({
  disabled,
  isPending,
  onDelete,
  onEdit,
  onPageChange,
  pagination,
  questions,
  subjectLabelsById = new Map(),
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Teacher question bank</caption>
          <thead className="bg-slate-950/55 text-xs tracking-wide text-slate-400 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium" scope="col">
                Question
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Subject
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Type
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Difficulty
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Marks
              </th>
              <th className="px-4 py-3 text-right font-medium" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isPending ? <LoadingRows /> : null}
            {!isPending && questions.length === 0 ? (
              <tr className="border-t border-slate-800">
                <td className="px-4 py-14 text-center text-sm text-slate-400" colSpan={6}>
                  No questions match these filters. Adjust the filters or create a new question.
                </td>
              </tr>
            ) : null}
            {!isPending
              ? questions.map((question) => (
                  <tr
                    className="border-t border-slate-800 align-top text-slate-300"
                    key={question.id}
                  >
                    <th className="max-w-xl px-4 py-4 font-normal" scope="row">
                      <p className="line-clamp-3 leading-6 font-medium text-white">
                        {question.content}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                        <span className="font-semibold text-slate-400">Answer:</span>{' '}
                        <QuestionAnswer question={question} />
                      </p>
                    </th>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400">
                      {subjectLabelsById.get(question.subjectId) ?? 'Unknown subject'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400">
                      {formatLabel(question.type)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyStyles[question.difficulty] ?? 'border-slate-700 text-slate-300'}`}
                      >
                        {formatLabel(question.difficulty)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium whitespace-nowrap text-white">
                      {question.marks.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={disabled}
                          onClick={() => onEdit(question)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={disabled}
                          onClick={() => onDelete(question)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
      <QuestionPagination
        disabled={disabled || isPending}
        onPageChange={onPageChange}
        pagination={pagination}
      />
    </div>
  )
}
