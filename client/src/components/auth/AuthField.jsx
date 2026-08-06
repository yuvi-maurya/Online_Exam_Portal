export function AuthField({ error, helperText, id, label, ...inputProps }) {
  const descriptionId = error ? `${id}-error` : helperText ? `${id}-help` : undefined

  return (
    <div>
      <label
        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        {...inputProps}
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className="focus:border-brand-400 focus:ring-brand-500/20 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 transition outline-none placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-600"
        id={id}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-rose-700 dark:text-rose-300" id={`${id}-error`}>
          {error}
        </p>
      ) : helperText ? (
        <p
          className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-500"
          id={`${id}-help`}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
