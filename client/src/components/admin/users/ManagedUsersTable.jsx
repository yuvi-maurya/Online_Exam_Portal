import { useTranslation } from 'react-i18next'
import i18n from '../../../i18n/index.js'

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? i18n.t('common.notAvailable') : DATE_FORMATTER.format(date)
}

function StatusBadge({ isActive }) {
  const { t } = useTranslation()

  return (
    <span
      className={
        isActive
          ? 'inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700/70 dark:text-slate-300'
      }
    >
      {isActive ? t('common.active') : t('common.inactive')}
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
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-600 uppercase dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <tr>
            <th className="px-5 py-3.5 font-medium" scope="col">
              {t('common.name')}
            </th>
            <th className="px-5 py-3.5 font-medium" scope="col">
              {t('common.email')}
            </th>
            <th className="px-5 py-3.5 font-medium" scope="col">
              {t('common.status')}
            </th>
            <th className="px-5 py-3.5 font-medium" scope="col">
              {t('common.added')}
            </th>
            <th className="px-5 py-3.5 text-right font-medium" scope="col">
              {t('common.action')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {users.map((user) => {
            const isThisRowPending = isActionPending && actionPendingId === user.id
            const actionLabel = user.isActive ? t('common.deactivate') : t('common.activate')

            return (
              <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-800/30" key={user.id}>
                <th className="px-5 py-4 font-medium text-slate-950 dark:text-white" scope="row">
                  {user.name}
                </th>
                <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{user.email}</td>
                <td className="px-5 py-4">
                  <StatusBadge isActive={user.isActive} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    aria-label={t('admin.users.toggleAria', {
                      action: actionLabel,
                      entity: entityLabel.toLowerCase(),
                      name: user.name,
                    })}
                    className={
                      user.isActive
                        ? 'rounded-lg border border-rose-400 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:border-rose-400/60 dark:hover:bg-rose-500/10'
                        : 'rounded-lg border border-emerald-400 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-500/10'
                    }
                    disabled={isActionPending}
                    onClick={() => onToggleActive(user)}
                    type="button"
                  >
                    {isThisRowPending
                      ? user.isActive
                        ? t('common.deactivating')
                        : t('common.activating')
                      : actionLabel}
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
