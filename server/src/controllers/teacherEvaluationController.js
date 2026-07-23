import { gradeAttemptAnswer, listPendingGrading } from '../services/attemptEvaluationService.js'
import { validateManualGrade } from '../utils/teacherEvaluationValidation.js'
import { validateTeacherResourceId } from '../utils/teacherValidation.js'

export async function gradeAnswer(request, response) {
  const result = await gradeAttemptAnswer({
    attemptId: validateTeacherResourceId(request.params.attemptId, 'attemptId'),
    marksAwarded: validateManualGrade(request.body),
    questionId: validateTeacherResourceId(request.params.questionId, 'questionId'),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Answer graded successfully.',
    data: result,
  })
}

export async function getPendingGrading(request, response) {
  const result = await listPendingGrading({
    examId: validateTeacherResourceId(request.params.id, 'examId'),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: result,
  })
}
