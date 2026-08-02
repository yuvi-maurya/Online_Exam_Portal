export function StudentPageHeader({ description, eyebrow, title }) {
  return (
    <header>
      {eyebrow ? (
        <p className="text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-sm text-slate-400">{description}</p> : null}
    </header>
  )
}
