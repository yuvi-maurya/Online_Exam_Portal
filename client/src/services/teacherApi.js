import { apiClient } from './apiClient.js'
import i18n from '../i18n/index.js'
import { normalizeBulkImportSummary } from '../utils/bulkImport.js'

export const teacherQueryKeys = Object.freeze({
  exam(id) {
    return ['teacher', 'exams', id]
  },
  examReport(id) {
    return ['teacher', 'exams', id, 'report']
  },
  exams: ['teacher', 'exams'],
  pendingGrading(examId) {
    return ['teacher', 'exams', examId, 'pending-grading']
  },
  question(id) {
    return ['teacher', 'questions', id]
  },
  questions(filters) {
    return ['teacher', 'questions', filters]
  },
  questionsRoot: ['teacher', 'questions'],
  subjects: ['teacher', 'subjects'],
})

function getResponseData(response) {
  if (!response?.data || typeof response.data !== 'object') {
    throw new Error(i18n.t('errors.invalidResponse'))
  }

  return response.data
}

function buildQuery(parameters) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  }

  return query.toString()
}

export async function listTeacherQuestions({
  difficulty,
  limit = 20,
  page = 1,
  subjectId,
  type,
} = {}) {
  const query = buildQuery({ difficulty, limit, page, subjectId, type })
  return getResponseData(await apiClient.get(`/teacher/questions?${query}`))
}

export async function listTeacherSubjects() {
  return getResponseData(await apiClient.get('/teacher/subjects')).subjects
}

export async function getTeacherQuestion(id) {
  return getResponseData(await apiClient.get(`/teacher/questions/${id}`)).question
}

export async function createTeacherQuestion(question) {
  return getResponseData(await apiClient.post('/teacher/questions', question)).question
}

export async function bulkImportTeacherQuestions(file) {
  const formData = new FormData()
  formData.set('file', file)
  const data = getResponseData(await apiClient.post('/teacher/questions/bulk-import', formData))

  return normalizeBulkImportSummary(data)
}

export async function updateTeacherQuestion(id, changes) {
  return getResponseData(await apiClient.patch(`/teacher/questions/${id}`, changes)).question
}

export async function deleteTeacherQuestion(id) {
  return getResponseData(await apiClient.delete(`/teacher/questions/${id}`)).question
}

export async function listTeacherExams() {
  return getResponseData(await apiClient.get('/teacher/exams')).exams
}

export async function getTeacherExam(id) {
  return getResponseData(await apiClient.get(`/teacher/exams/${id}`)).exam
}

export async function createTeacherExam(exam) {
  return getResponseData(await apiClient.post('/teacher/exams', exam)).exam
}

export async function updateTeacherExam(id, changes) {
  return getResponseData(await apiClient.patch(`/teacher/exams/${id}`, changes)).exam
}

export async function deleteTeacherExam(id) {
  return getResponseData(await apiClient.delete(`/teacher/exams/${id}`)).exam
}

export async function attachExamQuestions(examId, questions) {
  return getResponseData(await apiClient.post(`/teacher/exams/${examId}/questions`, { questions }))
    .exam
}

export async function updateAttachedQuestion(examId, questionId, changes) {
  return getResponseData(
    await apiClient.patch(`/teacher/exams/${examId}/questions/${questionId}`, changes),
  ).exam
}

export async function detachExamQuestion(examId, questionId) {
  return getResponseData(await apiClient.delete(`/teacher/exams/${examId}/questions/${questionId}`))
    .exam
}

export async function scheduleTeacherExam(id, schedule) {
  return getResponseData(await apiClient.patch(`/teacher/exams/${id}/schedule`, schedule)).exam
}

export async function publishTeacherExam(id) {
  return getResponseData(await apiClient.patch(`/teacher/exams/${id}/publish`, {})).exam
}

export async function archiveTeacherExam(id) {
  return getResponseData(await apiClient.patch(`/teacher/exams/${id}/archive`, {})).exam
}

export async function getPendingGrading(examId) {
  return getResponseData(await apiClient.get(`/teacher/exams/${examId}/pending-grading`))
}

export async function gradeTeacherAnswer(attemptId, questionId, marksAwarded) {
  return getResponseData(
    await apiClient.patch(`/teacher/attempts/${attemptId}/answers/${questionId}/grade`, {
      marksAwarded,
    }),
  )
}

export async function getTeacherExamReport(id) {
  return getResponseData(await apiClient.get(`/teacher/exams/${id}/report`)).report
}

export async function downloadTeacherExamReportCsv(id) {
  return apiClient.getBlob(`/teacher/exams/${id}/report?format=csv`)
}
