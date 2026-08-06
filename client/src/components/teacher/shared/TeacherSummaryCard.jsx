export function TeacherSummaryCard({ action, helper, label, value }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <div
        aria-hidden="true"
        className="bg-brand-500/10 absolute -top-12 -right-10 size-28 rounded-full blur-2xl"
      />
      <p className="relative text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <p className="relative mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
        {value}
      </p>
      {helper ? (
        <p className="relative mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      ) : null}
      {action ? <div className="relative mt-4">{action}</div> : null}
    </article>
  )
}
