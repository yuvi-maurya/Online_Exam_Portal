import { apiClient } from './apiClient.js'
import i18n from '../i18n/index.js'
import { normalizeBulkImportSummary } from '../utils/bulkImport.js'

const MANAGED_USER_RESOURCES = new Set(['students', 'teachers'])

export const adminQueryKeys = Object.freeze({
  dashboard: ['admin', 'dashboard'],
  managedUsers(resource, filters) {
    return ['admin', resource, filters]
  },
  overview: ['admin', 'reports', 'overview'],
  subjectReport: ['admin', 'reports', 'subject-wise'],
  subjects: ['admin', 'subjects'],
  topPerformers: ['admin', 'reports', 'top-performers'],
})

function assertManagedUserResource(resource) {
  if (!MANAGED_USER_RESOURCES.has(resource)) {
    throw new TypeError(i18n.t('errors.unsupportedManagedUserResource'))
  }
}

function getResponseData(response) {
  if (!response?.data || typeof response.data !== 'object') {
    throw new Error(i18n.t('errors.invalidResponse'))
  }

  return response.data
}

export async function getAdminDashboard() {
  return getResponseData(await apiClient.get('/admin/dashboard'))
}

export async function getAdminOverview() {
  return getResponseData(await apiClient.get('/admin/reports/overview'))
}

export async function listManagedUsers(resource, { limit = 20, page = 1, search = '' } = {}) {
  assertManagedUserResource(resource)

  const query = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  })
  const normalizedSearch = search.trim()

  if (normalizedSearch) {
    query.set('search', normalizedSearch)
  }

  return getResponseData(await apiClient.get(`/admin/${resource}?${query.toString()}`))
}

export async function createManagedUser(resource, user) {
  assertManagedUserResource(resource)
  return getResponseData(await apiClient.post(`/admin/${resource}`, user))
}

export async function bulkImportStudents(file) {
  const formData = new FormData()
  formData.set('file', file)
  const data = getResponseData(await apiClient.post('/admin/students/bulk-import', formData))

  return normalizeBulkImportSummary(data)
}

export async function setManagedUserActive(resource, id, isActive) {
  assertManagedUserResource(resource)
  const action = isActive ? 'activate' : 'deactivate'
  return getResponseData(await apiClient.patch(`/admin/${resource}/${id}/${action}`, {}))
}

export async function listSubjects() {
  return getResponseData(await apiClient.get('/admin/subjects')).subjects
}

export async function createSubject(subject) {
  return getResponseData(await apiClient.post('/admin/subjects', subject)).subject
}

export async function updateSubject(id, changes) {
  return getResponseData(await apiClient.patch(`/admin/subjects/${id}`, changes)).subject
}

export async function deleteSubject(id) {
  return getResponseData(await apiClient.delete(`/admin/subjects/${id}`)).subject
}

export async function getSubjectWiseReport() {
  return getResponseData(await apiClient.get('/admin/reports/subject-wise')).subjects
}

export async function getTopPerformers() {
  return getResponseData(await apiClient.get('/admin/reports/top-performers')).topPerformers
}

export async function downloadAdminReportCsv(report) {
  if (!['overview', 'subject-wise'].includes(report)) {
    throw new TypeError(i18n.t('errors.unsupportedAdminReportExport'))
  }

  return apiClient.getBlob(`/admin/reports/${report}?format=csv`)
}
