import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ResultQuestionCard } from '../../components/student/result/ResultQuestionCard.jsx'
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

function formatNumber(value) {
  const number = Number(value)
  return value !== null && value !== '' && Number.isFinite(number)
    ? numberFormatter.format(number)
    : '—'
}

function formatPercentage(value) {
  const formatted = formatNumber(value)
  return formatted === '—' ? formatted : `${formatted}%`
}

function formatDuration(totalSeconds) {
  const seconds = Number(totalSeconds)

  if (!Number.isFinite(seconds) || seconds < 0) {
    return '—'
  }

  const roundedSeconds = Math.round(seconds)
  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const remainingSeconds = roundedSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${remainingSeconds}s`
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

  useDocumentTitle(result?.exam?.title ? `${result.exam.title} result` : 'Exam result')

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {securityNotice ? (
        <section
          className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-100"
          role="status"
        >
          <p className="font-semibold">Attempt automatically submitted</p>
          <p className="mt-1 text-amber-100/75">{securityNotice}</p>
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
          message={getApiErrorMessage(
            resultQuery.error,
            'This result could not be loaded. Confirm that the attempt belongs to your account and try again.',
          )}
          onRetry={() => resultQuery.refetch()}
        />
      ) : null}

      {resultQuery.isSuccess ? (
        <>
          <header className="rounded-3xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-brand-400 text-xs font-semibold tracking-[0.18em] uppercase">
                  Evaluated result
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {result.exam.title}
                </h1>
                <p className="mt-3 text-sm text-slate-400">
                  {formatDate(result.evaluatedAt)
                    ? `Evaluated ${formatDate(result.evaluatedAt)}`
                    : 'Evaluation complete'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
                  to="/student/history"
                >
                  Exam history
                </Link>
                <Link
                  className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition"
                  to="/student"
                >
                  Browse exams
                </Link>
              </div>
            </div>
          </header>

          <section aria-label="Result summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ResultSummaryCard
              helper={`${formatNumber(result.score)} of ${formatNumber(result.totalMarks)} marks`}
              label="Score"
              value={`${formatNumber(result.score)} / ${formatNumber(result.totalMarks)}`}
            />
            <ResultSummaryCard label="Percentage" value={formatPercentage(result.percentage)} />
            <ResultSummaryCard
              helper={result.result === 'PASS' ? 'Congratulations!' : 'Review your answers below'}
              label="Result"
              tone={result.result === 'PASS' ? 'success' : 'danger'}
              value={result.result === 'PASS' ? 'Passed' : 'Not passed'}
            />
            <ResultSummaryCard label="Rank" value={formatNumber(result.rank)} />
            <ResultSummaryCard label="Time taken" value={formatDuration(result.timeTakenSeconds)} />
          </section>

          <section aria-labelledby="question-breakdown-title" className="space-y-4">
            <div>
              <p className="text-brand-400 text-xs font-semibold tracking-[0.16em] uppercase">
                Answer review
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white" id="question-breakdown-title">
                Question breakdown
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Compare your submitted answers with the correct answers and awarded marks.
              </p>
            </div>

            {result.questions.length > 0 ? (
              result.questions.map((question) => (
                <ResultQuestionCard key={question.questionId} question={question} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                No question breakdown is available for this result.
              </div>
            )}
          </section>
        </>
      ) : null}

      {resultQuery.isFetching && !resultQuery.isPending && !resultQuery.isError ? (
        <p className="text-right text-xs text-slate-500" role="status">
          Refreshing result…
        </p>
      ) : null}
    </main>
  )
}
