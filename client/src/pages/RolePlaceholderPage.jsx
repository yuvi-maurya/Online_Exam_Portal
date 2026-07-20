import { useOutletContext } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatRoleName } from '../utils/formatRoleName.js'

export function RolePlaceholderPage() {
  const { role } = useOutletContext()
  const roleName = formatRoleName(role)

  useDocumentTitle(roleName)

  return (
    <main className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-10">
        <p className="text-brand-400 text-sm font-semibold">{roleName} module boundary</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Ready for a future feature phase</h1>
        <p className="mt-4 leading-7 text-slate-400">
          This placeholder confirms that the role route group is wired correctly. Authentication,
          authorization, screens, and business behavior are intentionally not implemented.
        </p>
      </div>
    </main>
  )
}
