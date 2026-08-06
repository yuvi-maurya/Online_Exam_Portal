import { listAuditLogs } from '../services/auditLogService.js'
import { validateAuditLogQuery } from '../utils/auditValidation.js'

export async function getAdminAuditLogs(request, response) {
  const { auditLogs, pagination } = await listAuditLogs(validateAuditLogQuery(request.query))

  response.status(200).json({
    status: 'success',
    data: { auditLogs, pagination },
  })
}
