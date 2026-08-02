const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMATTER.format(date)
}

function StatusBadge({ isActive }) {
  return (
    <span
      className={
        isActive
          ? 'inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300'
          : 'inline-flex rounded-full bg-slate-700/70 px-2.5 py-1 text-xs font-medium text-slate-300'
      }
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

export function ManagedUsersTable({
  actionPendingId,
  entityLabel,
  isActionPending,
  onToggleActive,
  users,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="border-b border-slate-800 bg-slate-950/40 text-xs tracking-wide text-slate-400 uppercase">
          <tr>
            <th className="px-5 py-3.5 font-medium" scope="col">
              Name
            </th>
            <th className="px-5 py-3.5 font-medium" scope="col">
              Email
            </th>
            <th className="px-5 py-3.5 font-medium" scope="col">
              Status
            </th>
            <th className="px-5 py-3.5 font-medium" scope="col">
              Added
            </th>
            <th className="px-5 py-3.5 text-right font-medium" scope="col">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {users.map((user) => {
            const isThisRowPending = isActionPending && actionPendingId === user.id
            const actionLabel = user.isActive ? 'Deactivate' : 'Activate'

            return (
              <tr className="transition hover:bg-slate-800/30" key={user.id}>
                <th className="px-5 py-4 font-medium text-white" scope="row">
                  {user.name}
                </th>
                <td className="px-5 py-4 text-slate-300">{user.email}</td>
                <td className="px-5 py-4">
                  <StatusBadge isActive={user.isActive} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    aria-label={`${actionLabel} ${entityLabel.toLowerCase()} ${user.name}`}
                    className={
                      user.isActive
                        ? 'rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-400/60 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50'
                        : 'rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50'
                    }
                    disabled={isActionPending}
                    onClick={() => onToggleActive(user)}
                    type="button"
                  >
                    {isThisRowPending ? `${actionLabel.slice(0, -1)}ing…` : actionLabel}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
