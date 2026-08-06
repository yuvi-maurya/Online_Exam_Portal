export function ResultSummaryCard({ helper, label, tone = 'default', value }) {
  const toneClasses = {
    danger:
      'border-rose-500/35 bg-rose-50 text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100',
    default:
      'border-slate-200 bg-white/90 text-slate-950 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white',
    success:
      'border-emerald-500/35 bg-emerald-50 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100',
  }

  return (
    <article className={`rounded-2xl border p-5 ${toneClasses[tone] ?? toneClasses.default}`}>
      <p className="text-xs font-semibold tracking-[0.16em] text-slate-600 uppercase dark:text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{helper}</p> : null}
    </article>
  )
}
