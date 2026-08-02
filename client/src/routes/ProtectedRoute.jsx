import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { NotAuthorizedPage } from '../pages/NotAuthorizedPage.jsx'

export function ProtectedRoute({ allowedRoles = [] }) {
  const { isLoading, loading, user } = useAuth()
  const location = useLocation()
  const isAuthLoading = isLoading ?? loading

  if (isAuthLoading) {
    return (
      <main
        aria-busy="true"
        className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center"
      >
        <div>
          <span
            aria-hidden="true"
            className="border-brand-400 mx-auto block size-9 animate-spin rounded-full border-2 border-t-transparent"
          />
          <p className="mt-4 text-sm text-slate-400">Restoring your session…</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  const normalizedAllowedRoles = allowedRoles.map((role) => role.toUpperCase())
  const currentRole = user.role?.toUpperCase()

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(currentRole)) {
    return <NotAuthorizedPage userRole={currentRole} />
  }

  return <Outlet />
}
