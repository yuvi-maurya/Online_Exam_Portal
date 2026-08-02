import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export function NotAuthorizedPage({ userRole }) {
  useDocumentTitle('Not authorized')

  const dashboardPath = userRole ? `/${userRole.toLowerCase()}` : '/'

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center">
      <div className="max-w-md">
        <p className="text-brand-400 text-sm font-semibold">403</p>
        <h1 className="mt-3 text-3xl font-bold text-white">You are not authorized</h1>
        <p className="mt-3 leading-7 text-slate-400">
          Your account does not have permission to open this area of Exam Portal.
        </p>
        <Link
          className="bg-brand-500 hover:bg-brand-600 mt-7 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
          to={dashboardPath}
        >
          Go to your dashboard
        </Link>
      </div>
    </main>
  )
}
