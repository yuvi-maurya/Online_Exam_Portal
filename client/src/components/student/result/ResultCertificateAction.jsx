import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getStudentCertificates, studentQueryKeys } from '../../../services/studentApi.js'

const CERTIFICATE_POLL_INTERVAL_MS = 10_000
const CERTIFICATE_POLL_WINDOW_MS = 60_000

function findExamCertificate(certificates, examId) {
  if (!Array.isArray(certificates) || !examId) return null

  return (
    certificates.find((certificate) => certificate?.exam?.id === examId && certificate?.fileUrl) ??
    null
  )
}

export function ResultCertificateAction({ examId, isPassing }) {
  const { t } = useTranslation()
  const [pollingStartedAt] = useState(() => Date.now())
  const certificatesQuery = useQuery({
    enabled: isPassing && Boolean(examId),
    queryFn: getStudentCertificates,
    queryKey: studentQueryKeys.certificates,
    refetchInterval(query) {
      if (findExamCertificate(query.state.data, examId)) return false

      return Date.now() - pollingStartedAt < CERTIFICATE_POLL_WINDOW_MS
        ? CERTIFICATE_POLL_INTERVAL_MS
        : false
    },
    refetchIntervalInBackground: false,
    retry: 2,
  })
  const certificate = findExamCertificate(certificatesQuery.data, examId)

  if (!isPassing) return null

  if (certificate) {
    return (
      <a
        className="inline-flex items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
        download
        href={certificate.fileUrl}
        rel="noreferrer"
        target="_blank"
      >
        {t('student.result.certificate.download')}
      </a>
    )
  }

  return (
    <div
      aria-live="polite"
      className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100"
      role="status"
    >
      <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-amber-300" />
      <span>
        {certificatesQuery.isPending
          ? t('student.result.certificate.checkingCertificate')
          : t('student.result.certificate.generating')}
      </span>
      {!certificatesQuery.isPending ? (
        <button
          className="rounded-lg border border-amber-500/30 px-2.5 py-1 text-xs font-bold transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60 dark:border-amber-300/25 dark:hover:bg-amber-400/10"
          disabled={certificatesQuery.isFetching}
          onClick={() => void certificatesQuery.refetch()}
          type="button"
        >
          {certificatesQuery.isFetching
            ? t('student.result.certificate.checking')
            : t('student.result.certificate.checkAgain')}
        </button>
      ) : null}
    </div>
  )
}
