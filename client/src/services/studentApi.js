import { apiClient } from './apiClient.js'
import i18n from '../i18n/index.js'

export const studentQueryKeys = Object.freeze({
  attempt(id) {
    return ['student', 'attempts', id]
  },
  availableExams: ['student', 'exams', 'available'],
  certificates: ['student', 'certificates'],
  examHistory: ['student', 'exams', 'history'],
  result(id) {
    return ['student', 'attempts', id, 'result']
  },
})

function getResponseData(response) {
  if (!response?.data || typeof response.data !== 'object') {
    throw new Error(i18n.t('errors.invalidResponse'))
  }

  return response.data
}

function getResponseArray(response, field) {
  const value = getResponseData(response)[field]

  if (!Array.isArray(value)) {
    throw new Error(i18n.t('errors.invalidResponse'))
  }

  return value
}

export async function getAvailableExams() {
  return getResponseArray(await apiClient.get('/student/exams'), 'exams')
}

export async function getExamHistory() {
  return getResponseArray(await apiClient.get('/student/exams/history'), 'attempts')
}

export async function getStudentCertificates() {
  return getResponseArray(await apiClient.get('/student/certificates'), 'certificates')
}

export async function startExam(examId) {
  return getResponseData(await apiClient.post(`/student/exams/${examId}/start`)).attempt
}

export async function getAttempt(attemptId) {
  return getResponseData(await apiClient.get(`/student/attempts/${attemptId}`)).attempt
}

export async function saveAnswer(attemptId, answer) {
  return getResponseData(await apiClient.patch(`/student/attempts/${attemptId}/answers`, answer))
    .answer
}

export async function submitAttempt(attemptId) {
  return getResponseData(await apiClient.post(`/student/attempts/${attemptId}/submit`)).attempt
}

export async function recordAttemptViolation(attemptId, type) {
  return getResponseData(
    await apiClient.patch(`/student/attempts/${attemptId}/violation`, { type }),
  ).violation
}

export async function getAttemptResult(attemptId) {
  return getResponseData(await apiClient.get(`/student/attempts/${attemptId}/result`)).result
}
