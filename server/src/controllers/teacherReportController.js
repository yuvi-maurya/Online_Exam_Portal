import { getTeacherExamReport } from '../services/teacherReportService.js'
import { buildTeacherExamReportCsv, sendCsvDownload } from '../utils/reportCsv.js'
import { validateReportFormat } from '../utils/reportValidation.js'
import { validateTeacherResourceId } from '../utils/teacherValidation.js'

export async function getExamReport(request, response) {
  const format = validateReportFormat(request.query)
  const report = await getTeacherExamReport({
    examId: validateTeacherResourceId(request.params.id, 'examId'),
    teacherId: request.user.userId,
  })

  if (format === 'csv') {
    return sendCsvDownload(response, 'teacher-exam-report.csv', buildTeacherExamReportCsv(report))
  }

  response.status(200).json({
    status: 'success',
    data: { report },
  })
}
