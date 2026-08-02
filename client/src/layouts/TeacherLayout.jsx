import { Link, Outlet, useLocation } from 'react-router-dom'

const teacherNavigation = [
  {
    isActive: (pathname) => pathname === '/teacher',
    label: 'Dashboard',
    to: '/teacher',
  },
  {
    isActive: (pathname) => pathname.startsWith('/teacher/questions'),
    label: 'Question Bank',
    to: '/teacher/questions',
  },
  {
    isActive: (pathname) => pathname.startsWith('/teacher/exams') && !pathname.endsWith('/report'),
    label: 'Exams',
    to: '/teacher/exams',
  },
  {
    isActive: (pathname) => pathname.startsWith('/teacher/grading'),
    label: 'Grading',
    to: '/teacher/grading',
  },
  {
    isActive: (pathname) => pathname.startsWith('/teacher/reports') || pathname.endsWith('/report'),
    label: 'Reports',
    to: '/teacher/reports',
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

export function TeacherLayout() {
  const { pathname } = useLocation()

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col lg:min-h-[calc(100vh-73px)] lg:flex-row">
      <aside className="border-b border-slate-800 bg-slate-900/35 px-4 py-4 lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-5 lg:py-8">
        <div className="mb-5 hidden px-3 lg:block">
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Teaching
          </p>
          <p className="mt-2 text-sm text-slate-300">Build, grade, and review exams</p>
        </div>

        <nav aria-label="Teacher navigation" className="flex gap-2 overflow-x-auto lg:flex-col">
          {teacherNavigation.map(({ isActive, label, to }) => {
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
