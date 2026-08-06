import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ResultQuestionCard } from '../../components/student/result/ResultQuestionCard.jsx'
import { ResultCertificateAction } from '../../components/student/result/ResultCertificateAction.jsx'
import {
  ResultErrorState,
  ResultLoadingState,
  ResultPendingState,
} from '../../components/student/result/ResultQueryState.jsx'
import { ResultSummaryCard } from '../../components/student/result/ResultSummaryCard.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { ApiError, getApiErrorMessage } from '../../services/apiClient.js'
import { getAttemptResult, studentQueryKeys } from '../../services/studentApi.js'

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

function formatNumber(value, t) {
  const number = Number(value)
  return value !== null && value !== '' && Number.isFinite(number)
    ? numberFormatter.format(number)
    : t('student.common.notAvailable')
}

function formatPercentage(value, t) {
  const formatted = formatNumber(value, t)
  return formatted === t('student.common.notAvailable') ? formatted : `${formatted}%`
}

function formatDuration(totalSeconds, t) {
  const seconds = Number(totalSeconds)

  if (!Number.isFinite(seconds) || seconds < 0) {
    return t('student.common.notAvailable')
  }

  const roundedSeconds = Math.round(seconds)
  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const remainingSeconds = roundedSeconds % 60

  if (hours > 0) {
    return t('student.result.duration.hoursMinutesSeconds', {
      hours,
      minutes,
      seconds: remainingSeconds,
    })
  }

  if (minutes > 0) {
    return t('student.result.duration.minutesSeconds', {
      minutes,
      seconds: remainingSeconds,
    })
  }

  return t('student.result.duration.seconds', { count: remainingSeconds })
}

function formatDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

function isPendingEvaluationError(error) {
  return error instanceof ApiError && error.status === 409 && error.code === 'ATTEMPT_NOT_EVALUATED'
}

function shouldRetry(failureCount, error) {
  if (error instanceof ApiError && [403, 404, 409].includes(error.status)) {
    return false
  }

  return failureCount < 2
}

export function StudentResultPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const location = useLocation()
  const resultQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getAttemptResult(id),
    queryKey: studentQueryKeys.result(id),
    retry: shouldRetry,
  })
  const result = resultQuery.data
  const pendingEvaluation = isPendingEvaluationError(resultQuery.error)
  const securityNotice =
    typeof location.state?.notice === 'string' ? location.state.notice.slice(0, 500) : ''

  useDocumentTitle(
    result?.exam?.title
      ? t('student.result.documentTitleWithExam', { exam: result.exam.title })
      : t('student.result.documentTitle'),
  )

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {securityNotice ? (
        <section
          className="rounded-2xl border border-amber-500/35 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100"
          role="status"
        >
          <p className="font-semibold">{t('student.result.autoSubmittedTitle')}</p>
          <p className="mt-1 text-amber-700 dark:text-amber-100/75">{securityNotice}</p>
        </section>
      ) : null}

      {resultQuery.isPending ? <ResultLoadingState /> : null}

      {resultQuery.isError && pendingEvaluation ? (
        <ResultPendingState
          isChecking={resultQuery.isFetching}
          message={getApiErrorMessage(resultQuery.error, '')}
          onRetry={() => resultQuery.refetch()}
        />
      ) : null}

      {resultQuery.isError && !pendingEvaluation ? (
        <ResultErrorState
          message={getApiErrorMessage(resultQuery.error, t('student.result.errors.load'))}
          onRetry={() => resultQuery.refetch()}
        />
      ) : null}

      {resultQuery.isSuccess ? (
        <>
          <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900/65 dark:shadow-none">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
                  {t('student.result.eyebrow')}
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                  {result.exam.title}
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(result.evaluatedAt)
                    ? t('student.result.evaluatedAt', { date: formatDate(result.evaluatedAt) })
                    : t('student.result.evaluationComplete')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ResultCertificateAction
                  examId={result.exam.id}
                  isPassing={result.result === 'PASS'}
                  key={`${result.exam.id}:${result.result}`}
                />
                <Link
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
                  to="/student/history"
                >
                  {t('student.result.examHistory')}
                </Link>
                <Link
                  className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition"
                  to="/student"
                >
                  {t('student.result.browseExams')}
                </Link>
              </div>
            </div>
          </header>

          <section
            aria-label={t('student.result.summaryAria')}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
          >
            <ResultSummaryCard
              helper={t('student.result.scoreHelper', {
                score: formatNumber(result.score, t),
                total: formatNumber(result.totalMarks, t),
              })}
              label={t('student.result.score')}
              value={`${formatNumber(result.score, t)} / ${formatNumber(result.totalMarks, t)}`}
            />
            <ResultSummaryCard
              label={t('student.result.percentage')}
              value={formatPercentage(result.percentage, t)}
            />
            <ResultSummaryCard
              helper={
                result.result === 'PASS'
                  ? t('student.result.congratulations')
                  : t('student.result.reviewBelow')
              }
              label={t('student.result.resultLabel')}
              tone={result.result === 'PASS' ? 'success' : 'danger'}
              value={
                result.result === 'PASS'
                  ? t('student.result.passed')
                  : t('student.result.notPassed')
              }
            />
            <ResultSummaryCard
              label={t('student.result.rank')}
              value={formatNumber(result.rank, t)}
            />
            <ResultSummaryCard
              label={t('student.result.timeTaken')}
              value={formatDuration(result.timeTakenSeconds, t)}
            />
          </section>

          <section aria-labelledby="question-breakdown-title" className="space-y-4">
            <div>
              <p className="text-brand-600 dark:text-brand-400 text-xs font-semibold tracking-[0.16em] uppercase">
                {t('student.result.reviewEyebrow')}
              </p>
              <h2
                className="mt-2 text-2xl font-bold text-slate-950 dark:text-white"
                id="question-breakdown-title"
              >
                {t('student.result.breakdownTitle')}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {t('student.result.breakdownDescription')}
              </p>
            </div>

            {result.questions.length > 0 ? (
              result.questions.map((question) => (
                <ResultQuestionCard key={question.questionId} question={question} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-transparent dark:text-slate-400">
                {t('student.result.breakdownEmpty')}
              </div>
            )}
          </section>
        </>
      ) : null}

      {resultQuery.isFetching && !resultQuery.isPending && !resultQuery.isError ? (
        <p className="text-right text-xs text-slate-500 dark:text-slate-400" role="status">
          {t('student.result.refreshing')}
        </p>
      ) : null}
    </main>
  )
}
