import { getAdminDashboardSummary } from '../services/adminDashboardService.js'

export async function getAdminDashboard(_request, response) {
  const summary = await getAdminDashboardSummary()

  response.status(200).json({
    status: 'success',
    data: summary,
  })
}
