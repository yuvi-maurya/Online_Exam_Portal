import i18n from '../i18n/index.js'

export function downloadBlob(blob, filename) {
  if (!(blob instanceof Blob)) {
    throw new TypeError(i18n.t('errors.invalidDownloadedReport'))
  }

  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
}
