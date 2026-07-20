import { Link } from 'react-router-dom'
import { formatRoleName } from '../utils/formatRoleName.js'

export function RouteGroupCard({ description, role, to }) {
  return (
    <Link
      className="group hover:border-brand-400/70 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:bg-slate-900"
      to={to}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="bg-brand-500/10 text-brand-400 rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          {formatRoleName(role)}
        </span>
        <span
          aria-hidden="true"
          className="group-hover:text-brand-400 text-slate-500 transition group-hover:translate-x-1"
        >
          →
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-400">{description}</p>
    </Link>
  )
}
