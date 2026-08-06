import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export function SubjectDeleteDialog({ error, isPending, onCancel, onConfirm, subject }) {
  const { t } = useTranslation()
  const cancelButtonRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!subject) {
      return undefined
    }

    const previouslyFocused = document.activeElement
    cancelButtonRef.current?.focus()

    return () => {
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus()
      } else {
        document.querySelector('[data-create-subject-button]')?.focus()
      }
    }
  }, [subject])

  if (!subject) {
    return null
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      if (!isPending) {
        onCancel()
      }

      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = dialogRef.current?.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )

    if (!focusableElements?.length) {
      event.preventDefault()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return (
    <div
      aria-describedby="delete-subject-description"
      aria-labelledby="delete-subject-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      onKeyDown={handleKeyDown}
      ref={dialogRef}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/20 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
        <p className="text-xs font-semibold tracking-[0.16em] text-rose-700 uppercase dark:text-rose-300">
          {t('admin.subjects.delete.eyebrow')}
        </p>
        <h2
          className="mt-2 text-xl font-semibold text-slate-950 dark:text-white"
          id="delete-subject-title"
        >
          {t('admin.subjects.delete.title', { name: subject.name })}
        </h2>
        <p
          className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400"
          id="delete-subject-description"
        >
          {t('admin.subjects.delete.description')}
        </p>

        {error ? (
          <div
            className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            disabled={isPending}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {t('common.cancel')}
          </button>
          <button
            className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {isPending ? t('common.deleting') : t('admin.subjects.delete.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
