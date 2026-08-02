import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { formatRoleName } from '../utils/formatRoleName.js'

export function RoleLayout({ role }) {
  const { logout, user } = useAuth()
  const roleName = formatRoleName(role)
  const contentWidth = ['admin', 'teacher'].includes(role) ? 'max-w-[90rem]' : 'max-w-6xl'

  return (
    <div className="min-h-screen bg-slate-950" data-route-boundary="role-protected">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className={`mx-auto flex ${contentWidth} items-center justify-between px-6 py-4`}>
          <Link className="text-sm font-medium text-slate-300 hover:text-white" to="/">
            ← Exam Portal
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{roleName}</p>
            </div>
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
              onClick={logout}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <Outlet context={{ role }} />
    </div>
  )
}
