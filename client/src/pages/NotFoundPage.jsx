import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center">
      <div>
        <p className="text-brand-400 text-sm font-semibold">404</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-3 text-slate-400">The requested route does not exist.</p>
        <Link
          className="text-brand-400 hover:text-brand-100 mt-7 inline-block text-sm font-semibold"
          to="/"
        >
          Return to the project shell
        </Link>
      </div>
    </main>
  )
}
