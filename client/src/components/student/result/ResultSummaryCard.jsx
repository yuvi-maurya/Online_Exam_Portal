export function ResultSummaryCard({ helper, label, tone = 'default', value }) {
  const toneClasses = {
    danger: 'border-rose-500/25 bg-rose-500/10 text-rose-100',
    default: 'border-slate-800 bg-slate-900/70 text-white',
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
  }

  return (
    <article className={`rounded-2xl border p-5 ${toneClasses[tone] ?? toneClasses.default}`}>
      <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </article>
  )
}
