import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

const adminNavigation = [
  { end: true, labelKey: 'layout.admin.navigation.dashboard', to: '/admin' },
  { labelKey: 'layout.admin.navigation.students', to: '/admin/students' },
  { labelKey: 'layout.admin.navigation.teachers', to: '/admin/teachers' },
  { labelKey: 'layout.admin.navigation.subjects', to: '/admin/subjects' },
  { labelKey: 'layout.admin.navigation.reports', to: '/admin/reports' },
]

function getNavigationClassName({ isActive }) {
  return [
    'flex shrink-0 items-center rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-brand-500 text-white shadow-lg shadow-sky-950/30'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white',
  ].join(' ')
}

export function AdminLayout() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col lg:min-h-[calc(100vh-73px)] lg:flex-row">
      <aside className="border-b border-slate-200 bg-white/80 px-4 py-4 lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-5 lg:py-8 dark:border-slate-800 dark:bg-slate-900/35">
        <div className="mb-5 hidden px-3 lg:block">
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            {t('layout.admin.eyebrow')}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t('layout.admin.description')}
          </p>
        </div>

        <nav
          aria-label={t('layout.admin.navigation.label')}
          className="flex gap-2 overflow-x-auto lg:flex-col"
        >
          {adminNavigation.map(({ end, labelKey, to }) => (
            <NavLink className={getNavigationClassName} end={end} key={to} to={to}>
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
