import {
  createTeacherQuestion,
  deleteTeacherQuestion,
  getTeacherQuestion,
  listTeacherQuestions,
  updateTeacherQuestion,
} from '../services/teacherQuestionService.js'
import {
  validateQuestionCreate,
  validateQuestionFilters,
  validateQuestionUpdate,
  validateTeacherResourceId,
} from '../utils/teacherValidation.js'

export async function createQuestion(request, response) {
  const question = await createTeacherQuestion({
    question: validateQuestionCreate(request.body),
    teacherId: request.user.userId,
  })

  response.status(201).json({
    status: 'success',
    message: 'Question created successfully.',
    data: { question },
  })
}

export async function listQuestions(request, response) {
  const result = await listTeacherQuestions({
    filters: validateQuestionFilters(request.query),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: result,
  })
}

export async function getQuestion(request, response) {
  const question = await getTeacherQuestion({
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: { question },
  })
}

export async function updateQuestion(request, response) {
  const question = await updateTeacherQuestion({
    changes: validateQuestionUpdate(request.body),
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Question updated successfully.',
    data: { question },
  })
}

export async function deleteQuestion(request, response) {
  const question = await deleteTeacherQuestion({
    id: validateTeacherResourceId(request.params.id),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Question deleted successfully.',
    data: { question },
  })
}
