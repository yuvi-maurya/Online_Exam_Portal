import { useEffect } from 'react'
import i18n from '../i18n/index.js'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title
      ? i18n.t('app.documentTitleWithPage', { page: title })
      : i18n.t('app.name')
  }, [title])
}
