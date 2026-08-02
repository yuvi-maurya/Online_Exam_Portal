import { Link } from 'react-router-dom'

export function AuthCard({ children, description, footer, title }) {
  return (
    <main className="relative isolate flex min-h-[calc(100vh-81px)] items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 mx-auto h-96 max-w-3xl bg-[radial-gradient(circle_at_center,rgba(22,139,224,0.18),transparent_68%)]"
      />
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
        <Link
          className="bg-brand-500 shadow-brand-500/20 mb-7 grid size-11 place-items-center rounded-xl text-sm font-bold text-white shadow-lg"
          to="/"
          aria-label="Exam Portal home"
        >
          EP
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        <div className="mt-7">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-slate-400">{footer}</div> : null}
      </section>
    </main>
  )
}
