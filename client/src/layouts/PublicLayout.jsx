import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-white/5">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link className="flex items-center gap-3 font-semibold text-white" to="/">
            <span className="bg-brand-500 shadow-brand-500/20 grid size-9 place-items-center rounded-xl text-sm shadow-lg">
              EP
            </span>
            Exam Portal
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
              to="/login"
            >
              Sign in
            </Link>
            <Link
              className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-2 text-sm font-semibold text-white transition"
              to="/register"
            >
              <span className="sm:hidden">Register</span>
              <span className="hidden sm:inline">Create account</span>
            </Link>
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
