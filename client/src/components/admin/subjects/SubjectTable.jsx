import { useTranslation } from 'react-i18next'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '\u2014' : dateFormatter.format(date)
}

function LoadingRows() {
  return Array.from({ length: 4 }, (_, index) => (
    <tr className="border-t border-slate-200 dark:border-slate-800" key={index}>
      {Array.from({ length: 4 }, (__, column) => (
        <td className="px-4 py-5" key={column}>
          <span className="block h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </td>
      ))}
    </tr>
  ))
}

export function SubjectTable({ disabled, isPending, onDelete, onEdit, subjects }) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{t('admin.subjects.table.caption')}</caption>
        <thead className="bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:bg-slate-950/40 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium" scope="col">
              {t('common.subject')}
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              {t('common.description')}
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              {t('common.created')}
            </th>
            <th className="px-4 py-3 text-right font-medium" scope="col">
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {isPending ? <LoadingRows /> : null}
          {!isPending && subjects.length === 0 ? (
            <tr className="border-t border-slate-200 dark:border-slate-800">
              <td
                className="px-4 py-12 text-center text-sm text-slate-600 dark:text-slate-400"
                colSpan={4}
              >
                {t('admin.subjects.table.empty')}
              </td>
            </tr>
          ) : null}
          {!isPending
            ? subjects.map((subject) => (
                <tr
                  className="border-t border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                  key={subject.id}
                >
                  <th className="px-4 py-4 font-medium text-slate-950 dark:text-white" scope="row">
                    <span className="block">{subject.name}</span>
                    <span className="mt-1 block font-mono text-xs font-normal text-slate-500 dark:text-slate-400">
                      {subject.code}
                    </span>
                  </th>
                  <td className="max-w-md px-4 py-4 leading-6 text-slate-600 dark:text-slate-400">
                    {subject.description || (
                      <span className="text-slate-600 italic dark:text-slate-400">
                        {t('common.notProvided')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {formatDate(subject.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                        disabled={disabled}
                        onClick={() => onEdit(subject)}
                        type="button"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        className="rounded-lg border border-rose-400 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        disabled={disabled}
                        onClick={() => onDelete(subject)}
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
  )
}
