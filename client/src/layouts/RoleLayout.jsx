import { Link, Outlet } from 'react-router-dom'
import { formatRoleName } from '../utils/formatRoleName.js'

export function RoleLayout({ role }) {
  const roleName = formatRoleName(role)

  return (
    <div className="min-h-screen bg-slate-950" data-route-boundary="role-protected">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link className="text-sm font-medium text-slate-300 hover:text-white" to="/">
            ← Exam Portal
          </Link>
          <span className="bg-brand-500/10 text-brand-400 rounded-full px-3 py-1 text-xs font-semibold">
            {roleName} route group
          </span>
        </div>
      </header>
      <Outlet context={{ role }} />
    </div>
  )
}
