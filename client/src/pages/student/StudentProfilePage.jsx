import { StudentPageHeader } from '../../components/student/shell/StudentPageHeader.jsx'
import { StudentQueryError } from '../../components/student/shell/StudentQueryState.jsx'
import { formatStatus } from '../../components/student/shell/studentFormatters.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'

export function StudentProfilePage() {
  useDocumentTitle('Student profile')

  const { isLoading, user } = useAuth()

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <StudentPageHeader
        description="These details come from your verified Exam Portal account and are currently read-only."
        eyebrow="Account"
        title="Your profile"
      />

      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading profile"
          className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/55"
        />
      ) : null}
      {!isLoading && !user ? (
        <StudentQueryError
          message="Your account details are unavailable. Sign in again to refresh your session."
          title="Profile unavailable"
        />
      ) : null}
      {!isLoading && user ? (
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-slate-950/20">
          <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
            <div className="bg-brand-500 flex size-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg shadow-sky-950/30">
              {user.name?.trim().charAt(0).toUpperCase() || 'S'}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">{user.name}</h2>
            <p className="mt-1 text-sm text-slate-400">Student account</p>
          </div>

          <dl className="divide-y divide-slate-800">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Full name</dt>
              <dd className="text-sm text-slate-200">{user.name}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Email address</dt>
              <dd className="text-sm break-all text-slate-200">{user.email}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:px-6">
              <dt className="text-sm font-medium text-slate-500">Role</dt>
              <dd className="text-sm text-slate-200">{formatStatus(user.role)}</dd>
            </div>
          </dl>

          <p className="border-t border-slate-800 bg-slate-950/30 px-5 py-4 text-xs text-slate-500 sm:px-6">
            Profile editing is not available yet. Contact an administrator if these details are
            incorrect.
          </p>
        </section>
      ) : null}
    </main>
  )
}
