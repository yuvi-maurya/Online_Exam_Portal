import i18n from '../../../i18n/index.js'

export function formatExamStatus(status) {
  if (!status) {
    return i18n.t('common.unknown')
  }

  return i18n.t(`statuses.${status}`, { defaultValue: i18n.t('common.unknown') })
}
