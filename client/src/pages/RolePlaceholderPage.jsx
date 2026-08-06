import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatRoleName } from '../utils/formatRoleName.js'

export function RolePlaceholderPage() {
  const { t } = useTranslation()
  const { role } = useOutletContext()
  const roleName = formatRoleName(role)

  useDocumentTitle(roleName)

  return (
    <main className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold">
          {t('rolePlaceholder.dashboard', { role: roleName })}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
          {t('rolePlaceholder.title')}
        </h1>
        <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
          {t('rolePlaceholder.description')}
        </p>
      </div>
    </main>
  )
}
