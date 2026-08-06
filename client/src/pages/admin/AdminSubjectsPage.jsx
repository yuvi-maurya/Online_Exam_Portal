import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminPageHeader, AdminPanel, AdminQueryError } from '../../components/admin/index.js'
import { SubjectDeleteDialog } from '../../components/admin/subjects/SubjectDeleteDialog.jsx'
import { SubjectForm } from '../../components/admin/subjects/SubjectForm.jsx'
import { SubjectTable } from '../../components/admin/subjects/SubjectTable.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import {
  adminQueryKeys,
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from '../../services/adminApi.js'
import { ApiError, getApiErrorMessage } from '../../services/apiClient.js'

function getDeleteErrorMessage(error, t) {
  if (error instanceof ApiError && error.code === 'SUBJECT_HAS_DEPENDENCIES') {
    return t('admin.subjects.errors.dependencies')
  }

  return getApiErrorMessage(error, t('admin.subjects.errors.delete'))
}

export function AdminSubjectsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('admin.subjects.documentTitle'))

  const queryClient = useQueryClient()
  const [editor, setEditor] = useState(null)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')

  const subjectsQuery = useQuery({
    queryFn: listSubjects,
    queryKey: adminQueryKeys.subjects,
  })

  async function refreshSubjectData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.subjects }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.subjectReport }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: createSubject,
    onError: (error) => {
      setFormError(getApiErrorMessage(error, t('admin.subjects.errors.create')))
    },
    onSuccess: async (subject) => {
      await refreshSubjectData()
      setEditor(null)
      setNotice(t('admin.subjects.notices.created', { name: subject.name }))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateSubject(id, payload),
    onError: (error) => {
      setFormError(getApiErrorMessage(error, t('admin.subjects.errors.save')))
    },
    onSuccess: async (subject) => {
      await refreshSubjectData()
      setEditor(null)
      setNotice(t('admin.subjects.notices.updated', { name: subject.name }))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onError: (error) => {
      setDeleteError(getDeleteErrorMessage(error, t))
    },
    onSuccess: async (subject) => {
      await refreshSubjectData()
      setDeleteTarget(null)
      setDeleteError('')
      setNotice(t('admin.subjects.notices.deleted', { name: subject.name }))
    },
  })

  const isFormPending = createMutation.isPending || updateMutation.isPending
  const isMutating = isFormPending || deleteMutation.isPending

  function openCreateForm() {
    createMutation.reset()
    updateMutation.reset()
    setEditor({ mode: 'create', subject: null })
    setFormError('')
    setNotice('')
  }

  function openEditForm(subject) {
    createMutation.reset()
    updateMutation.reset()
    setEditor({ mode: 'edit', subject })
    setFormError('')
    setNotice('')
  }

  function closeForm() {
    if (isFormPending) {
      return
    }

    setEditor(null)
    setFormError('')
  }

  function submitSubject(payload) {
    setFormError('')
    setNotice('')

    if (editor?.mode === 'edit') {
      updateMutation.mutate({ id: editor.subject.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  function openDeleteDialog(subject) {
    deleteMutation.reset()
    setDeleteTarget(subject)
    setDeleteError('')
    setNotice('')
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) {
      return
    }

    setDeleteTarget(null)
    setDeleteError('')
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <AdminPageHeader
        actions={
          <button
            className="bg-brand-500 hover:bg-brand-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            data-create-subject-button
            disabled={isMutating}
            onClick={openCreateForm}
            type="button"
          >
            {t('admin.subjects.create')}
          </button>
        }
        description={t('admin.subjects.description')}
        eyebrow={t('admin.subjects.eyebrow')}
        title={t('common.subjects')}
      />

      {notice ? (
        <div
          className="mt-7 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {editor ? (
        <div className="mt-7">
          <AdminPanel
            description={
              editor.mode === 'edit'
                ? t('admin.subjects.form.editDescription')
                : t('admin.subjects.form.createDescription')
            }
            title={
              editor.mode === 'edit'
                ? t('admin.subjects.form.editTitle', { name: editor.subject.name })
                : t('admin.subjects.form.createTitle')
            }
          >
            <SubjectForm
              error={formError}
              isPending={isFormPending}
              key={editor.mode === 'edit' ? editor.subject.id : 'create'}
              mode={editor.mode}
              onCancel={closeForm}
              onClearError={() => setFormError('')}
              onSubmit={submitSubject}
              subject={editor.subject}
            />
          </AdminPanel>
        </div>
      ) : null}

      <div className="mt-7">
        <AdminPanel
          description={t('admin.subjects.listDescription')}
          title={t('admin.subjects.allTitle')}
        >
          {subjectsQuery.isError ? (
            <AdminQueryError
              message={getApiErrorMessage(subjectsQuery.error, t('admin.subjects.errors.load'))}
              onRetry={() => subjectsQuery.refetch()}
            />
          ) : (
            <SubjectTable
              disabled={isMutating}
              isPending={subjectsQuery.isPending}
              onDelete={openDeleteDialog}
              onEdit={openEditForm}
              subjects={subjectsQuery.data ?? []}
            />
          )}
        </AdminPanel>
      </div>

      <SubjectDeleteDialog
        error={deleteError}
        isPending={deleteMutation.isPending}
        onCancel={closeDeleteDialog}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        subject={deleteTarget}
      />
    </main>
  )
}
