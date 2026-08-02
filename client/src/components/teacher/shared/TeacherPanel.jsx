export function TeacherPanel({ children, description, title }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5 sm:p-6">
      {title ? (
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
