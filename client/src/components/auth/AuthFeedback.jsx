export function AuthError({ message }) {
  if (!message) {
    return null
  }

  return (
    <div
      className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
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
      className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
      role="status"
    >
      {message}
    </div>
  )
}
