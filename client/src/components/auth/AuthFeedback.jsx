export function AuthError({ message }) {
  if (!message) {
    return null
  }

  return (
    <div
      className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
      role="alert"
    >
      {message}
    </div>
  )
}

export function AuthNotice({ message }) {
  if (!message) {
    return null
  }

  return (
    <div
      className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
      role="status"
    >
      {message}
    </div>
  )
}
