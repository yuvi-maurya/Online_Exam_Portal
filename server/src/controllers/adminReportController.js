import {
  getAdminOverviewReportData,
  getAdminSubjectWiseReportData,
  getAdminTopPerformersReportData,
} from '../services/adminReportService.js'
import {
  buildAdminOverviewCsv,
  buildAdminSubjectWiseCsv,
  sendCsvDownload,
} from '../utils/reportCsv.js'
import { validateReportFormat } from '../utils/reportValidation.js'

export async function getAdminOverviewReport(request, response) {
  const format = validateReportFormat(request.query)
  const overview = await getAdminOverviewReportData()

  if (format === 'csv') {
    return sendCsvDownload(response, 'admin-overview-report.csv', buildAdminOverviewCsv(overview))
  }

  response.status(200).json({
    status: 'success',
    data: overview,
  })
}

export async function getAdminSubjectWiseReport(request, response) {
  const format = validateReportFormat(request.query)
  const subjects = await getAdminSubjectWiseReportData()

  if (format === 'csv') {
    return sendCsvDownload(
      response,
      'admin-subject-wise-report.csv',
      buildAdminSubjectWiseCsv(subjects),
    )
  }

  response.status(200).json({
    status: 'success',
    data: { subjects },
  })
}

export async function getAdminTopPerformersReport(_request, response) {
  const topPerformers = await getAdminTopPerformersReportData()

  response.status(200).json({
    status: 'success',
    data: { topPerformers },
  })
}
