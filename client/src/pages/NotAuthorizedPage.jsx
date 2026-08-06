import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export function NotAuthorizedPage({ userRole }) {
  const { t } = useTranslation()
  useDocumentTitle(t('notAuthorized.documentTitle'))

  const dashboardPath = userRole ? `/${userRole.toLowerCase()}` : '/'

  return (
    <main className="relative grid min-h-screen place-items-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md">
        <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold">403</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
          {t('notAuthorized.title')}
        </h1>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
          {t('notAuthorized.description')}
        </p>
        <Link
          className="bg-brand-500 hover:bg-brand-600 mt-7 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
          to={dashboardPath}
        >
          {t('notAuthorized.dashboard')}
        </Link>
      </div>
    </main>
  )
}
