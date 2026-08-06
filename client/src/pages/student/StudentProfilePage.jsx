import { useTranslation } from 'react-i18next'
import { StudentPageHeader } from '../../components/student/shell/StudentPageHeader.jsx'
import { StudentQueryError } from '../../components/student/shell/StudentQueryState.jsx'
import { formatStatus } from '../../components/student/shell/studentFormatters.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'

export function StudentProfilePage() {
  const { t } = useTranslation()
  useDocumentTitle(t('student.profile.documentTitle'))

  const { isLoading, user } = useAuth()

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <StudentPageHeader
        description={t('student.profile.description')}
        eyebrow={t('student.profile.eyebrow')}
        title={t('student.profile.title')}
      />

      {isLoading ? (
        <div
          aria-busy="true"
          aria-label={t('student.profile.loadingAria')}
          className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900/55"
        />
      ) : null}
      {!isLoading && !user ? (
        <StudentQueryError
          message={t('student.profile.errors.unavailableDescription')}
          title={t('student.profile.errors.unavailableTitle')}
        />
      ) : null}
      {!isLoading && user ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/20">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-slate-800">
            <div className="bg-brand-500 flex size-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg shadow-sky-950/30">
              {user.name?.trim().charAt(0).toUpperCase() || 'S'}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
              {user.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t('student.profile.accountType')}
            </p>
          </div>

          <dl className="divide-y divide-slate-200 dark:divide-slate-800">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:px-6">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('student.profile.fullName')}
              </dt>
              <dd className="text-sm text-slate-800 dark:text-slate-200">{user.name}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:px-6">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('student.profile.emailAddress')}
              </dt>
              <dd className="text-sm break-all text-slate-800 dark:text-slate-200">{user.email}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:px-6">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('student.profile.role')}
              </dt>
              <dd className="text-sm text-slate-800 dark:text-slate-200">
                {formatStatus(user.role)}
              </dd>
            </div>
          </dl>

          <p className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500 sm:px-6 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
            {t('student.profile.editingUnavailable')}
          </p>
        </section>
      ) : null}
    </main>
  )
}
