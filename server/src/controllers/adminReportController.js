import {
  getAdminOverviewReportData,
  getAdminSubjectWiseReportData,
  getAdminTopPerformersReportData,
} from '../services/adminReportService.js'

export async function getAdminOverviewReport(_request, response) {
  const overview = await getAdminOverviewReportData()

  response.status(200).json({
    status: 'success',
    data: overview,
  })
}

export async function getAdminSubjectWiseReport(_request, response) {
  const subjects = await getAdminSubjectWiseReportData()

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
