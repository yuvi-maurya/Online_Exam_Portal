import i18n from '../i18n/index.js'

export function formatRoleName(role) {
  return i18n.t(`roles.${String(role ?? '').toUpperCase()}`, {
    defaultValue: i18n.t('roles.unknown'),
  })
}
