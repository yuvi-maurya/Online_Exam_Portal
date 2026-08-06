import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export function NotFoundPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('notFound.title'))

  return (
    <main className="relative grid min-h-screen place-items-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div>
        <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
          {t('notFound.title')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">{t('notFound.description')}</p>
        <Link
          className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-100 mt-7 inline-block text-sm font-semibold"
          to="/"
        >
          {t('notFound.returnHome')}
        </Link>
      </div>
    </main>
  )
}
