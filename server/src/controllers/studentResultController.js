import { getStudentAttemptResult } from '../services/studentResultService.js'
import { validateStudentResourceId } from '../utils/studentValidation.js'

export async function getAttemptResult(request, response) {
  const result = await getStudentAttemptResult({
    attemptId: validateStudentResourceId(request.params.id, 'attemptId'),
    studentId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: { result },
  })
}
