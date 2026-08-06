import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { StudentPageHeader } from '../../components/student/shell/StudentPageHeader.jsx'
import {
  StudentEmptyState,
  StudentQueryError,
} from '../../components/student/shell/StudentQueryState.jsx'
import { formatDateTime } from '../../components/student/shell/studentFormatters.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import { getStudentCertificates, studentQueryKeys } from '../../services/studentApi.js'

function CertificateSkeleton({ count = 3 }) {
  const { t } = useTranslation()

  return (
    <div
      aria-busy="true"
      aria-label={t('student.certificates.loadingAria')}
      className="grid gap-4 xl:grid-cols-2"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900/55"
          key={index}
        />
      ))}
    </div>
  )
}

function CertificateCard({ certificate }) {
  const { t } = useTranslation()
  const examTitle = certificate.exam?.title || t('student.certificates.examCertificate')

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-900/5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/20">
      <div
        aria-hidden="true"
        className="bg-brand-500/10 absolute -top-16 -right-16 size-40 rounded-full blur-3xl transition group-hover:bg-emerald-400/15"
      />

      <div className="relative flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-300">
          <svg
            aria-hidden="true"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
            <path d="m8.5 13.9-1 7.1 4.5-2 4.5 2-1-7.1" />
            <path d="m9.5 9 1.7 1.7L15 7" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase dark:text-emerald-400">
            {t('student.certificates.achievement')}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{examTitle}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t('student.certificates.issued', {
              date: formatDateTime(certificate.issuedAt, t('student.certificates.dateUnavailable')),
            })}
          </p>
        </div>
      </div>

      <div className="relative mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/45">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('student.certificates.verificationCode')}
        </p>
        <code className="mt-1 block text-sm font-semibold tracking-[0.12em] break-all text-slate-800 dark:text-slate-200">
          {certificate.certificateCode || t('student.common.unavailable')}
        </code>
      </div>

      <div className="relative mt-5 flex justify-end">
        {certificate.fileUrl ? (
          <a
            aria-label={t('student.certificates.downloadAria', { examTitle })}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
            href={certificate.fileUrl}
            rel="noreferrer"
            target="_blank"
          >
            <svg
              aria-hidden="true"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {t('student.certificates.download')}
          </a>
        ) : (
          <p className="text-sm text-amber-700 dark:text-amber-200">
            {t('student.certificates.fileUnavailable')}
          </p>
        )}
      </div>
    </article>
  )
}

export function StudentCertificatesPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('student.certificates.documentTitle'))

  const certificatesQuery = useQuery({
    queryFn: getStudentCertificates,
    queryKey: studentQueryKeys.certificates,
  })
  const certificates = Array.isArray(certificatesQuery.data) ? certificatesQuery.data : []

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <StudentPageHeader
        description={t('student.certificates.description')}
        eyebrow={t('student.certificates.eyebrow')}
        title={t('student.certificates.title')}
      />

      {certificatesQuery.isPending ? <CertificateSkeleton /> : null}
      {certificatesQuery.isError ? (
        <StudentQueryError
          message={getApiErrorMessage(
            certificatesQuery.error,
            t('student.certificates.errors.load'),
          )}
          onRetry={() => certificatesQuery.refetch()}
        />
      ) : null}
      {certificatesQuery.isSuccess && certificates.length === 0 ? (
        <StudentEmptyState
          description={t('student.certificates.emptyDescription')}
          title={t('student.certificates.emptyTitle')}
        />
      ) : null}
      {certificatesQuery.isSuccess && certificates.length > 0 ? (
        <section aria-label={t('student.certificates.earnedAria')}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-950 dark:text-white">
                {certificates.length}
              </span>{' '}
              {t('student.certificates.earnedCount', { count: certificates.length })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('student.certificates.newestFirst')}
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {certificates.map((certificate) => (
              <CertificateCard certificate={certificate} key={certificate.id} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
