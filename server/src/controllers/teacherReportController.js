import { getTeacherExamReport } from '../services/teacherReportService.js'
import { validateTeacherResourceId } from '../utils/teacherValidation.js'

export async function getExamReport(request, response) {
  const report = await getTeacherExamReport({
    examId: validateTeacherResourceId(request.params.id, 'examId'),
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: { report },
  })
}
