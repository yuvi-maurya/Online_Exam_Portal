import { useTranslation } from 'react-i18next'

const difficultyStyles = {
  EASY: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200',
  HARD: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200',
  MEDIUM:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200',
}

function QuestionAnswer({ question }) {
  const { t } = useTranslation()

  if (question.options.length > 0) {
    const correctOption = question.options.find((option) => option.isCorrect)
    return correctOption?.text ?? t('teacher.questions.table.noCorrectOption')
  }

  return question.correctAnswerText || t('teacher.questions.table.noReferenceAnswer')
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr className="border-t border-slate-200 dark:border-slate-800" key={index}>
      {Array.from({ length: 6 }, (__, column) => (
        <td className="px-4 py-5" key={column}>
          <span className="block h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </td>
      ))}
    </tr>
  ))
}

function QuestionPagination({ disabled, onPageChange, pagination }) {
  const { t } = useTranslation()

  if (!pagination || pagination.total === 0) return null

  const start = (pagination.page - 1) * pagination.limit + 1
  const end = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <p className="text-slate-600 dark:text-slate-400">
        {t('teacher.questions.table.showing', {
          end: end.toLocaleString(),
          start: start.toLocaleString(),
          total: pagination.total.toLocaleString(),
        })}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          disabled={disabled || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          type="button"
        >
          {t('common.previous')}
        </button>
        <span className="min-w-24 text-center text-slate-600 dark:text-slate-400">
          {t('common.pageOf', {
            current: pagination.page,
            total: Math.max(1, pagination.totalPages),
          })}
        </span>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          disabled={disabled || pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          type="button"
        >
          {t('common.next')}
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
  const { t } = useTranslation()

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">{t('teacher.questions.table.caption')}</caption>
          <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:bg-slate-950/55 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('common.question')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('common.subject')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('common.type')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('common.difficulty')}
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                {t('common.marks')}
              </th>
              <th className="px-4 py-3 text-right font-medium" scope="col">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isPending ? <LoadingRows /> : null}
            {!isPending && questions.length === 0 ? (
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <td
                  className="px-4 py-14 text-center text-sm text-slate-600 dark:text-slate-400"
                  colSpan={6}
                >
                  {t('teacher.questions.table.empty')}
                </td>
              </tr>
            ) : null}
            {!isPending
              ? questions.map((question) => (
                  <tr
                    className="border-t border-slate-200 align-top text-slate-700 dark:border-slate-800 dark:text-slate-300"
                    key={question.id}
                  >
                    <th className="max-w-xl px-4 py-4 font-normal" scope="row">
                      <p className="line-clamp-3 leading-6 font-medium text-slate-950 dark:text-white">
                        {question.content}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t('common.answer')}:
                        </span>{' '}
                        <QuestionAnswer question={question} />
                      </p>
                    </th>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {subjectLabelsById.get(question.subjectId) ?? t('common.unknownSubject')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {t(`questions.types.${question.type}`)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyStyles[question.difficulty] ?? 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'}`}
                      >
                        {t(`questions.difficulties.${question.difficulty}`)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium whitespace-nowrap text-slate-950 dark:text-white">
                      {question.marks.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                          disabled={disabled}
                          onClick={() => onEdit(question)}
                          type="button"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          className="rounded-lg border border-rose-400 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                          disabled={disabled}
                          onClick={() => onDelete(question)}
                          type="button"
                        >
                          {t('common.delete')}
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
