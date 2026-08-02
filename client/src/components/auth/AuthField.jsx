export function AuthField({ error, helperText, id, label, ...inputProps }) {
  const descriptionId = error ? `${id}-error` : helperText ? `${id}-help` : undefined

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className="focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-3 text-sm text-white transition outline-none placeholder:text-slate-600 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
        id={id}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-rose-300" id={`${id}-error`}>
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500" id={`${id}-help`}>
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
