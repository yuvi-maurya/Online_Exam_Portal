import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-white/5">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link className="flex items-center gap-3 font-semibold text-white" to="/">
            <span className="bg-brand-500 shadow-brand-500/20 grid size-9 place-items-center rounded-xl text-sm shadow-lg">
              EP
            </span>
            Exam Portal
          </Link>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-400">
            Phase 1 · Foundation
          </span>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
