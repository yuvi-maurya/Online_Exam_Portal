import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getApiErrorMessage } from '../services/apiClient.js'
import { downloadBlob } from '../utils/downloadBlob.js'

export function ExportCsvButton({ filename, getFile, label }) {
  const { t } = useTranslation()
  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await getFile()
      downloadBlob(blob, filename)
    },
  })

  return (
    <div className="text-right">
      <button
        className="inline-flex rounded-xl border border-sky-600/40 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-400/30 dark:text-sky-300 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
        disabled={exportMutation.isPending}
        onClick={() => exportMutation.mutate()}
        type="button"
      >
        {exportMutation.isPending ? t('exports.preparing') : (label ?? t('exports.csv'))}
      </button>
      {exportMutation.isError ? (
        <p className="mt-1 max-w-52 text-xs text-rose-700 dark:text-rose-300" role="alert">
          {getApiErrorMessage(exportMutation.error, t('exports.errors.submit'))}
        </p>
      ) : null}
    </div>
  )
}
