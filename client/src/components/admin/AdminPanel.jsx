export function AdminPanel({ children, description, title }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/55">
      {title ? (
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
