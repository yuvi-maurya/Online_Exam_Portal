import {
  getStudentAttempt,
  recordStudentAttemptViolation,
  saveStudentAnswer,
  submitStudentAttempt,
} from '../services/studentAttemptService.js'
import {
  validateAttemptViolation,
  validateStudentAnswer,
  validateStudentResourceId,
} from '../utils/studentValidation.js'

export async function getAttempt(request, response) {
  const attempt = await getStudentAttempt({
    attemptId: validateStudentResourceId(request.params.id, 'attemptId'),
    studentId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: { attempt },
  })
}

export async function saveAnswer(request, response) {
  const answer = await saveStudentAnswer({
    answer: validateStudentAnswer(request.body),
    attemptId: validateStudentResourceId(request.params.id, 'attemptId'),
    studentId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Answer saved successfully.',
    data: { answer },
  })
}

export async function submitAttempt(request, response) {
  const attempt = await submitStudentAttempt({
    attemptId: validateStudentResourceId(request.params.id, 'attemptId'),
    studentId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Exam attempt submitted successfully.',
    data: { attempt },
  })
}

export async function recordViolation(request, response) {
  const { type } = validateAttemptViolation(request.body)
  const violation = await recordStudentAttemptViolation({
    attemptId: validateStudentResourceId(request.params.id, 'attemptId'),
    studentId: request.user.userId,
    type,
  })

  response.status(200).json({
    status: 'success',
    message:
      violation.autoFinalized && !violation.limitExceeded
        ? 'The exam time limit expired and the attempt was auto-submitted.'
        : violation.autoFinalized
          ? 'Violation recorded and the attempt was auto-submitted.'
          : 'Violation recorded successfully.',
    data: { violation },
  })
}
