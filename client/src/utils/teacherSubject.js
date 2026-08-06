import i18n from '../i18n/index.js'

export function formatSubjectLabel(subject) {
  const name = String(subject?.name ?? '').trim() || i18n.t('subjects.unnamed')
  const code = String(subject?.code ?? '').trim()

  return code ? `${name} (${code})` : name
}
