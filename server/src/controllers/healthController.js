import { getDatabaseHealth } from '../services/databaseService.js'

export async function getHealthStatus(request, response) {
  const database = await getDatabaseHealth({ log: request.log })

  response.status(200).json({
    status: 'ok',
    db: database.status,
    dbLatencyMs: database.latencyMs,
    uptime: Number(process.uptime().toFixed(2)),
  })
}
