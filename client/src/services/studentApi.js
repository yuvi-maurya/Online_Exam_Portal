import { apiClient } from './apiClient.js'

export const studentQueryKeys = Object.freeze({
  attempt(id) {
    return ['student', 'attempts', id]
  },
  availableExams: ['student', 'exams', 'available'],
  examHistory: ['student', 'exams', 'history'],
  result(id) {
    return ['student', 'attempts', id, 'result']
  },
})

function getResponseData(response) {
  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('The server returned an invalid response')
  }

  return response.data
}

function getResponseArray(response, field) {
  const value = getResponseData(response)[field]

  if (!Array.isArray(value)) {
    throw new Error('The server returned an invalid response')
  }

  return value
}

export async function getAvailableExams() {
  return getResponseArray(await apiClient.get('/student/exams'), 'exams')
}

export async function getExamHistory() {
  return getResponseArray(await apiClient.get('/student/exams/history'), 'attempts')
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
