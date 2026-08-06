import i18n from '../i18n/index.js'

export function normalizeBulkImportSummary(responseData) {
  const summary = responseData?.summary ?? responseData

  if (!summary || typeof summary !== 'object') {
    throw new Error(i18n.t('errors.invalidImportSummary'))
  }

  const skippedRowsSource = Array.isArray(summary.skippedRows)
    ? summary.skippedRows
    : Array.isArray(summary.skipped)
      ? summary.skipped
      : []
  const skippedRows = skippedRowsSource.map((entry, index) => ({
    reason:
      entry && typeof entry === 'object'
        ? (entry.reason ?? entry.message ?? entry.error ?? i18n.t('errors.importRowFailed'))
        : String(entry || i18n.t('errors.importRowFailed')),
    row:
      entry && typeof entry === 'object'
        ? (entry.row ?? entry.rowNumber ?? entry.line ?? index + 2)
        : index + 2,
  }))
  const warningRowsSource = Array.isArray(summary.warningRows) ? summary.warningRows : []
  const warningRows = warningRowsSource.map((entry, index) => ({
    reason:
      entry && typeof entry === 'object'
        ? (entry.reason ?? entry.message ?? entry.error ?? i18n.t('errors.importRowWarning'))
        : String(entry || i18n.t('errors.importRowWarning')),
    row:
      entry && typeof entry === 'object'
        ? (entry.row ?? entry.rowNumber ?? entry.line ?? index + 2)
        : index + 2,
  }))
  const parsedCreatedCount = Number(
    summary.createdCount ??
      (Array.isArray(summary.created) ? summary.created.length : summary.created) ??
      0,
  )
  const parsedSkippedCount = Number(
    summary.skippedCount ??
      (Array.isArray(summary.skipped) ? summary.skipped.length : summary.skipped) ??
      skippedRows.length,
  )
  const createdCount = Number.isFinite(parsedCreatedCount) ? parsedCreatedCount : 0
  const skippedCount = Number.isFinite(parsedSkippedCount) ? parsedSkippedCount : skippedRows.length
  const parsedWarningCount = Number(summary.warningCount ?? warningRows.length)
  const warningCount = Number.isFinite(parsedWarningCount) ? parsedWarningCount : warningRows.length
  const parsedTotalRows = Number(summary.totalRows ?? summary.total ?? createdCount + skippedCount)

  return {
    createdCount,
    skippedCount,
    skippedRows,
    totalRows: Number.isFinite(parsedTotalRows) ? parsedTotalRows : createdCount + skippedCount,
    warningCount,
    warningRows,
  }
}
