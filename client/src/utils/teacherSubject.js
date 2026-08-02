export function formatSubjectLabel(subject) {
  const name = String(subject?.name ?? '').trim() || 'Unnamed subject'
  const code = String(subject?.code ?? '').trim()

  return code ? `${name} (${code})` : name
}
