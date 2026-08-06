import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { formatRoleName } from '../utils/formatRoleName.js'

export function RoleLayout({ role }) {
  const { t } = useTranslation()
  const { logout, user } = useAuth()
  const roleName = formatRoleName(role)
  const contentWidth = ['admin', 'teacher'].includes(role) ? 'max-w-[90rem]' : 'max-w-6xl'

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
      data-route-boundary="role-protected"
    >
      <header className="border-b border-slate-200 bg-white/85 dark:border-slate-800 dark:bg-slate-900/70">
        <div className={`mx-auto flex ${contentWidth} items-center justify-between px-6 py-4`}>
          <Link
            className="text-sm font-medium text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            to="/"
          >
            <span aria-hidden="true">← </span>
            {t('layout.role.backToPortal')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-950 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t(`layout.roles.${role}`, { defaultValue: roleName })}
              </p>
            </div>
            <ThemeToggle />
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
              onClick={logout}
              type="button"
            >
              {t('layout.role.signOut')}
            </button>
          </div>
        </div>
      </header>
      <Outlet context={{ role }} />
    </div>
  )
}
