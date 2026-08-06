import { useMutation } from '@tanstack/react-query'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../services/apiClient.js'

function ImportSummary({ summary }) {
  const { t } = useTranslation()

  return (
    <div
      className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50"
      role="status"
    >
      <p className="font-semibold text-slate-950 dark:text-white">{t('bulkImport.complete')}</p>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
          <span className="block text-xs text-slate-500">{t('bulkImport.rowsProcessed')}</span>
          <span className="mt-1 block font-semibold text-slate-800 dark:text-slate-200">
            {summary.totalRows}
          </span>
        </div>
        <div className="rounded-lg bg-emerald-500/10 px-3 py-2">
          <span className="block text-xs text-emerald-700 dark:text-emerald-300/70">
            {t('bulkImport.created')}
          </span>
          <span className="mt-1 block font-semibold text-emerald-700 dark:text-emerald-200">
            {summary.createdCount}
          </span>
        </div>
        <div className="rounded-lg bg-amber-500/10 px-3 py-2">
          <span className="block text-xs text-amber-700 dark:text-amber-300/70">
            {t('bulkImport.skipped')}
          </span>
          <span className="mt-1 block font-semibold text-amber-700 dark:text-amber-200">
            {summary.skippedCount}
          </span>
        </div>
        <div className="rounded-lg bg-orange-500/10 px-3 py-2">
          <span className="block text-xs text-orange-700 dark:text-orange-300/70">
            {t('bulkImport.createdWithWarning')}
          </span>
          <span className="mt-1 block font-semibold text-orange-700 dark:text-orange-200">
            {summary.warningCount}
          </span>
        </div>
      </div>

      {summary.warningRows.length > 0 ? (
        <div className="mt-4" role="alert">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-100">
            {t('bulkImport.warnings')}
          </p>
          <p className="mt-1 text-xs text-orange-700 dark:text-orange-200/70">
            {t('bulkImport.warningExplanation')}
          </p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
            {summary.warningRows.map((entry, index) => (
              <li
                className="rounded-lg border border-orange-500/15 bg-orange-500/5 px-3 py-2"
                key={`${entry.row}-${index}`}
              >
                <span className="font-semibold text-orange-700 dark:text-orange-200">
                  {t('bulkImport.rowLabel', { row: entry.row })}
                </span>{' '}
                {entry.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.skippedRows.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
            {t('bulkImport.skippedDetails')}
          </p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
            {summary.skippedRows.map((entry, index) => (
              <li
                className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2"
                key={`${entry.row}-${index}`}
              >
                <span className="font-semibold text-amber-700 dark:text-amber-200">
                  {t('bulkImport.rowLabel', { row: entry.row })}
                </span>{' '}
                {entry.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function BulkImportPanel({ description, expectedColumns, importFile, onImported, title }) {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [selectionError, setSelectionError] = useState('')
  const [summary, setSummary] = useState(null)

  const importMutation = useMutation({
    mutationFn: importFile,
    onMutate: () => {
      setSelectionError('')
      setSummary(null)
    },
    onSuccess: async (result) => {
      setSummary(result)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await onImported?.(result)
    },
  })

  function selectFile(event) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setSelectionError('')
    setSummary(null)
    importMutation.reset()
  }

  function submitImport(event) {
    event.preventDefault()

    if (!file) {
      setSelectionError(t('bulkImport.errors.fileRequired'))
      return
    }

    importMutation.mutate(file)
  }

  const errorMessage = selectionError
    ? selectionError
    : importMutation.isError
      ? getApiErrorMessage(importMutation.error, t('bulkImport.errors.submit'))
      : ''

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-6 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/20">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
        {expectedColumns ? (
          <p className="mt-2 text-xs text-slate-500">
            {t('bulkImport.expectedColumns')}{' '}
            <span className="font-mono text-slate-600 dark:text-slate-400">{expectedColumns}</span>
          </p>
        ) : null}
      </div>

      <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submitImport}>
        <div className="min-w-0 flex-1">
          <label
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            htmlFor={inputId}
          >
            {t('bulkImport.fileLabel')}
          </label>
          <input
            accept=".csv,.xlsx"
            className="file:bg-brand-500 hover:file:bg-brand-400 block w-full rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:px-4 file:py-3 file:font-semibold file:text-white file:transition dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400"
            disabled={importMutation.isPending}
            id={inputId}
            onChange={selectFile}
            ref={inputRef}
            type="file"
          />
        </div>
        <button
          className="bg-brand-500 hover:bg-brand-400 focus:ring-brand-500/30 rounded-xl px-5 py-3 text-sm font-semibold text-white transition focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={importMutation.isPending || !file}
          type="submit"
        >
          {importMutation.isPending ? t('bulkImport.importing') : t('bulkImport.submit')}
        </button>
      </form>

      {errorMessage ? (
        <p
          className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      {summary ? <ImportSummary summary={summary} /> : null}
    </section>
  )
}
