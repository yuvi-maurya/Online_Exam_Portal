import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle.jsx'

export function PublicLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/60 dark:border-white/5 dark:bg-transparent">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link
            className="flex items-center gap-3 font-semibold text-slate-950 dark:text-white"
            to="/"
          >
            <span className="bg-brand-500 shadow-brand-500/20 grid size-9 place-items-center rounded-xl text-sm shadow-lg">
              {t('app.initials')}
            </span>
            <span className="hidden sm:inline">{t('layout.public.brand')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              to="/login"
            >
              {t('layout.public.signIn')}
            </Link>
            <Link
              className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-2 text-sm font-semibold text-white transition"
              to="/register"
            >
              <span className="sm:hidden">{t('layout.public.register')}</span>
              <span className="hidden sm:inline">{t('layout.public.createAccount')}</span>
            </Link>
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
