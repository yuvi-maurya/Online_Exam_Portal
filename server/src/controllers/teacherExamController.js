import {
  archiveTeacherExam,
  attachQuestionsToExam,
  createTeacherExam,
  deleteTeacherExam,
  detachQuestionFromExam,
  getTeacherExam,
  listTeacherExams,
  publishTeacherExam,
  scheduleTeacherExam,
  updateExamQuestion,
  updateTeacherExam,
} from '../services/teacherExamService.js'
import {
  validateExamCreate,
  validateExamQuestionAttachments,
  validateExamQuestionUpdate,
  validateExamSchedule,
  validateExamUpdate,
  validateTeacherResourceId,
} from '../utils/teacherValidation.js'

export async function createExam(request, response) {
  const exam = await createTeacherExam({
    exam: validateExamCreate(request.body),
    teacherId: request.user.userId,
  })

  response.status(201).json({
    status: 'success',
    message: 'Exam draft created successfully.',
    data: { exam },
  })
}

export async function listExams(request, response) {
  const exams = await listTeacherExams(request.user.userId)

  response.status(200).json({
    status: 'success',
    data: { exams },
  })
}

export async function getExam(request, response) {
  const exam = await getTeacherExam({
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: { exam },
  })
}

export async function updateExam(request, response) {
  const exam = await updateTeacherExam({
    changes: validateExamUpdate(request.body),
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Exam draft updated successfully.',
    data: { exam },
  })
}

export async function attachQuestions(request, response) {
  const exam = await attachQuestionsToExam({
    attachments: validateExamQuestionAttachments(request.body),
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Questions attached successfully.',
    data: { exam },
  })
}

export async function updateAttachedQuestion(request, response) {
  const exam = await updateExamQuestion({
    changes: validateExamQuestionUpdate(request.body),
    examId: validateTeacherResourceId(request.params.id),
    questionId: validateTeacherResourceId(request.params.questionId, 'questionId'),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Attached question updated successfully.',
    data: { exam },
  })
}

export async function detachQuestion(request, response) {
  const exam = await detachQuestionFromExam({
    examId: validateTeacherResourceId(request.params.id),
    questionId: validateTeacherResourceId(request.params.questionId, 'questionId'),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Question detached successfully.',
    data: { exam },
  })
}

export async function scheduleExam(request, response) {
  const exam = await scheduleTeacherExam({
    id: validateTeacherResourceId(request.params.id),
    schedule: validateExamSchedule(request.body),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Exam scheduled successfully.',
    data: { exam },
  })
}

export async function publishExam(request, response) {
  const exam = await publishTeacherExam({
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Exam published successfully.',
    data: { exam },
  })
}

export async function deleteExam(request, response) {
  const exam = await deleteTeacherExam({
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Exam deleted successfully.',
    data: { exam },
  })
}

export async function archiveExam(request, response) {
  const exam = await archiveTeacherExam({
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Exam archived successfully.',
    data: { exam },
  })
}
