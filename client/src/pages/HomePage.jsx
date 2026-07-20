import { RouteGroupCard } from '../components/RouteGroupCard.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { roleRouteGroups } from '../routes/routeGroups.js'

export function HomePage() {
  useDocumentTitle()

  return (
    <main className="relative isolate overflow-hidden px-6 py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 m-auto h-96 max-w-4xl bg-[radial-gradient(circle_at_center,rgba(22,139,224,0.18),transparent_65%)]"
      />
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <span className="border-brand-400/20 bg-brand-500/10 text-brand-100 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <span className="size-2 rounded-full bg-emerald-400" />
            Project foundation is ready
          </span>
          <h1 className="mt-7 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            A solid foundation for better online examinations.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            React, Vite, Tailwind CSS, React Router, and TanStack Query are configured. Feature
            modules will be introduced in later phases.
          </p>
        </div>

        <section className="mt-14" aria-labelledby="route-groups-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
                Route architecture
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white" id="route-groups-heading">
                Role-protected boundaries
              </h2>
            </div>
            <span className="hidden text-sm text-slate-500 sm:block">
              Structure only · no auth yet
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
