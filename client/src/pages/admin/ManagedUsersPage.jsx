import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminPageHeader } from '../../components/admin/index.js'
import { ManagedUserCreateForm } from '../../components/admin/users/ManagedUserCreateForm.jsx'
import { ManagedUsersTable } from '../../components/admin/users/ManagedUsersTable.jsx'
import { BulkImportPanel } from '../../components/BulkImportPanel.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { getApiErrorMessage } from '../../services/apiClient.js'
import {
  adminQueryKeys,
  createManagedUser,
  listManagedUsers,
  setManagedUserActive,
} from '../../services/adminApi.js'

const PAGE_SIZE = 10

function Feedback({ message, tone }) {
  if (!message) {
    return null
  }

  const toneClasses =
    tone === 'success'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
      : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'

  return (
    <div
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ${toneClasses}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {message}
    </div>
  )
}

export function ManagedUsersPage({ bulkImport, description, entityLabel, resource, title }) {
  const { t } = useTranslation()
  useDocumentTitle(title)

  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState('')

  const usersQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => listManagedUsers(resource, { limit: PAGE_SIZE, page, search }),
    queryKey: ['admin', resource, { limit: PAGE_SIZE, page, search }],
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createManagedUser(resource, payload),
    onMutate: () => {
      setSuccessMessage('')
      setActionError('')
    },
    onSuccess: async () => {
      setSuccessMessage(t('admin.users.createdSuccess', { entity: entityLabel }))
      setActionError('')
      setPage(1)
      setSearch('')
      setSearchInput('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', resource] }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
      ])
    },
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }) => setManagedUserActive(resource, id, isActive),
    onError: (error) => {
      setSuccessMessage('')
      setActionError(
        getApiErrorMessage(
          error,
          t('admin.users.errors.update', { entity: entityLabel.toLowerCase() }),
        ),
      )
    },
    onSuccess: async (_, variables) => {
      setActionError('')
      setSuccessMessage(
        t('admin.users.statusSuccess', {
          entity: entityLabel,
          status: variables.isActive ? t('common.activated') : t('common.deactivated'),
        }),
      )
      const invalidations = [queryClient.invalidateQueries({ queryKey: ['admin', resource] })]

      if (resource === 'students') {
        invalidations.push(queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }))
      }

      await Promise.all(invalidations)
    },
  })

  function handleSearch(event) {
    event.preventDefault()
    const normalizedSearch = searchInput.trim().replace(/\s+/g, ' ')
    setPage(1)

    if (normalizedSearch === search) {
      usersQuery.refetch()
      return
    }

    setSearch(normalizedSearch)
  }

  function clearSearch() {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  function handleToggleActive(user) {
    const nextActive = !user.isActive
    const action = nextActive ? t('common.activateLower') : t('common.deactivateLower')
    const confirmed = window.confirm(
      t('admin.users.confirmStatus', {
        action,
        name: user.name,
        warning: nextActive ? '' : t('admin.users.deactivateWarning'),
      }),
    )

    if (!confirmed) {
      return
    }

    setActionError('')
    setSuccessMessage('')
    activeMutation.mutate({ id: user.id, isActive: nextActive })
  }

  const users = usersQuery.data?.[resource] ?? []
  const pagination = usersQuery.data?.pagination
  const total = pagination?.total ?? 0
  const totalPages = Math.max(pagination?.totalPages ?? 0, 1)

  return (
    <main className="space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <AdminPageHeader description={description} eyebrow={t('admin.users.eyebrow')} title={title} />

      <ManagedUserCreateForm
        entityLabel={entityLabel}
        isPending={createMutation.isPending}
        onCreate={createMutation.mutateAsync}
      />

      {bulkImport ? (
        <BulkImportPanel
          description={bulkImport.description}
          expectedColumns={bulkImport.expectedColumns}
          importFile={bulkImport.importFile}
          onImported={async () => {
            setPage(1)
            setSearch('')
            setSearchInput('')
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['admin', resource] }),
              queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard }),
              queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview }),
            ])
          }}
          title={bulkImport.title}
        />
      ) : null}

      <Feedback message={successMessage} tone="success" />
      <Feedback message={actionError} tone="error" />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-slate-950/20">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t('admin.users.allTitle', { title })}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {usersQuery.isLoading
                ? t('admin.users.loadingRecords')
                : t('admin.users.recordCount', { count: total })}
            </p>
          </div>

          <form
            className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
            role="search"
            onSubmit={handleSearch}
          >
            <label className="sr-only" htmlFor={`${resource}-search`}>
              {t('admin.users.searchLabel', { title: title.toLowerCase() })}
            </label>
            <input
              className="focus:border-brand-400 focus:ring-brand-500/20 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 transition outline-none placeholder:text-slate-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-600"
              id={`${resource}-search`}
              maxLength={100}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              type="search"
              value={searchInput}
            />
            <div className="flex gap-2">
              {search ? (
                <button
                  className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                  onClick={clearSearch}
                  type="button"
                >
                  {t('common.clear')}
                </button>
              ) : null}
              <button
                className="bg-brand-500 hover:bg-brand-400 focus:ring-brand-500/30 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus:ring-4 focus:outline-none"
                type="submit"
              >
                {t('common.search')}
              </button>
            </div>
          </form>
        </div>

        {usersQuery.isLoading ? (
          <div className="flex min-h-64 items-center justify-center p-8" role="status">
            <div className="text-center">
              <div className="border-brand-400 mx-auto size-8 animate-spin rounded-full border-2 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {t('admin.users.loading', { title: title.toLowerCase() })}
              </p>
            </div>
          </div>
        ) : usersQuery.isError ? (
          <div className="flex min-h-64 items-center justify-center p-8 text-center" role="alert">
            <div>
              <p className="font-medium text-rose-700 dark:text-rose-200">
                {getApiErrorMessage(
                  usersQuery.error,
                  t('admin.users.errors.load', { title: title.toLowerCase() }),
                )}
              </p>
              <button
                className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:text-white dark:hover:border-slate-600"
                onClick={() => usersQuery.refetch()}
                type="button"
              >
                {t('common.tryAgain')}
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center p-8 text-center">
            <div>
              <p className="font-medium text-slate-950 dark:text-white">
                {search
                  ? t('admin.users.emptySearch', { title: title.toLowerCase() })
                  : t('admin.users.empty', { title: title.toLowerCase() })}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {search
                  ? t('admin.users.tryAnotherSearch')
                  : t('admin.users.addFirst', { entity: entityLabel.toLowerCase() })}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              {usersQuery.isFetching ? (
                <span
                  className="absolute top-3 right-5 z-10 rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  role="status"
                >
                  {t('common.refreshing')}
                </span>
              ) : null}
              <ManagedUsersTable
                actionPendingId={activeMutation.variables?.id}
                entityLabel={entityLabel}
                isActionPending={activeMutation.isPending}
                onToggleActive={handleToggleActive}
                users={users}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-400">
                {t('common.pageOf', {
                  current: pagination?.page ?? page,
                  total: totalPages,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-slate-300 px-3.5 py-2 font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                  disabled={page <= 1 || usersQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  {t('common.previous')}
                </button>
                <button
                  className="rounded-lg border border-slate-300 px-3.5 py-2 font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                  disabled={page >= totalPages || usersQuery.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  type="button"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
