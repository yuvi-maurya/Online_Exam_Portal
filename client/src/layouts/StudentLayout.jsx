import { Link, Outlet, useLocation } from 'react-router-dom'

const studentNavigation = [
  {
    isActive: (pathname) => pathname === '/student' || pathname.startsWith('/student/attempts'),
    label: 'Dashboard / Exams',
    to: '/student',
  },
  {
    isActive: (pathname) => pathname.startsWith('/student/history'),
    label: 'History',
    to: '/student/history',
  },
  {
    isActive: (pathname) => pathname.startsWith('/student/profile'),
    label: 'Profile',
    to: '/student/profile',
  },
]

function getNavigationClassName(isActive) {
  return [
    'flex shrink-0 items-center rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-brand-500 text-white shadow-lg shadow-sky-950/30'
      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white',
  ].join(' ')
}

export function StudentLayout() {
  const { pathname } = useLocation()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col lg:min-h-[calc(100vh-73px)] lg:flex-row">
      <aside className="border-b border-slate-800 bg-slate-900/35 px-4 py-4 lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-5 lg:py-8">
        <div className="mb-5 hidden px-3 lg:block">
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Student workspace
          </p>
          <p className="mt-2 text-sm text-slate-300">Take exams and track your progress</p>
        </div>

        <nav aria-label="Student navigation" className="flex gap-2 overflow-x-auto lg:flex-col">
          {studentNavigation.map(({ isActive, label, to }) => {
            const active = isActive(pathname)

            return (
              <Link
                aria-current={active ? 'page' : undefined}
                className={getNavigationClassName(active)}
                key={to}
                to={to}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
