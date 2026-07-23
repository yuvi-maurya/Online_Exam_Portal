import {
  listAvailableStudentExams,
  listStudentExamHistory,
  startStudentExam,
} from '../services/studentExamService.js'
import { validateStudentResourceId } from '../utils/studentValidation.js'

export async function listExams(request, response) {
  const exams = await listAvailableStudentExams(request.user.userId)

  response.status(200).json({
    status: 'success',
    data: { exams },
  })
}

export async function listExamHistory(request, response) {
  const attempts = await listStudentExamHistory(request.user.userId)

  response.status(200).json({
    status: 'success',
    data: { attempts },
  })
}

export async function startExam(request, response) {
  const { attempt, created } = await startStudentExam({
    examId: validateStudentResourceId(request.params.id, 'examId'),
    studentId: request.user.userId,
  })

  response.status(created ? 201 : 200).json({
    status: 'success',
    message: created
      ? 'Exam attempt started successfully.'
      : 'Existing in-progress attempt returned.',
    data: { attempt },
  })
}
