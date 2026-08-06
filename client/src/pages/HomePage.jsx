import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RouteGroupCard } from '../components/RouteGroupCard.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { roleRouteGroups } from '../routes/routeGroups.js'

export function HomePage() {
  const { t } = useTranslation()
  useDocumentTitle()

  return (
    <main className="relative isolate overflow-hidden px-6 py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 m-auto h-96 max-w-4xl bg-[radial-gradient(circle_at_center,rgba(22,139,224,0.18),transparent_65%)]"
      />
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <span className="border-brand-400/30 bg-brand-500/10 text-brand-600 dark:border-brand-400/20 dark:text-brand-100 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <span className="size-2 rounded-full bg-emerald-400" />
            {t('home.securityReady')}
          </span>
          <h1 className="mt-7 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl dark:text-white">
            {t('home.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            {t('home.description')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
              to="/login"
            >
              {t('auth.login.submit')}
            </Link>
            <Link
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
              to="/register"
            >
              {t('home.createStudentAccount')}
            </Link>
            <Link
              className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-white"
              to="/verify-certificate"
            >
              {t('home.verifyCertificate')}
            </Link>
          </div>
        </div>

        <section className="mt-14" aria-labelledby="route-groups-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
                {t('home.roleGroups.eyebrow')}
              </p>
              <h2
                className="mt-2 text-xl font-semibold text-slate-950 dark:text-white"
                id="route-groups-heading"
              >
                {t('home.roleGroups.title')}
              </h2>
            </div>
            <span className="hidden text-sm text-slate-500 sm:block">
              {t('home.roleGroups.accessNote')}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {roleRouteGroups.map((routeGroup) => (
              <RouteGroupCard key={routeGroup.role} {...routeGroup} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
