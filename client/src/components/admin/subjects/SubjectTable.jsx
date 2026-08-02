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
    <tr className="border-t border-slate-800" key={index}>
      {Array.from({ length: 4 }, (__, column) => (
        <td className="px-4 py-5" key={column}>
          <span className="block h-4 animate-pulse rounded bg-slate-800" />
        </td>
      ))}
    </tr>
  ))
}

export function SubjectTable({ disabled, isPending, onDelete, onEdit, subjects }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">Exam Portal subjects</caption>
        <thead className="bg-slate-950/40 text-xs tracking-wide text-slate-400 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium" scope="col">
              Subject
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Description
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Created
            </th>
            <th className="px-4 py-3 text-right font-medium" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isPending ? <LoadingRows /> : null}
          {!isPending && subjects.length === 0 ? (
            <tr className="border-t border-slate-800">
              <td className="px-4 py-12 text-center text-sm text-slate-400" colSpan={4}>
                No subjects yet. Create the first subject to make it available for exams and
                questions.
              </td>
            </tr>
          ) : null}
          {!isPending
            ? subjects.map((subject) => (
                <tr className="border-t border-slate-800 text-slate-300" key={subject.id}>
                  <th className="px-4 py-4 font-medium text-white" scope="row">
                    <span className="block">{subject.name}</span>
                    <span className="mt-1 block font-mono text-xs font-normal text-slate-500">
                      {subject.code}
                    </span>
                  </th>
                  <td className="max-w-md px-4 py-4 leading-6 text-slate-400">
                    {subject.description || (
                      <span className="text-slate-600 italic">Not provided</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-400">
                    {formatDate(subject.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disabled}
                        onClick={() => onEdit(subject)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disabled}
                        onClick={() => onDelete(subject)}
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
  )
}
