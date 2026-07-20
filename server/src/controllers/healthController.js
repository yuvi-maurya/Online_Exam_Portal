import { getDatabaseStatus } from '../services/databaseService.js'

export async function getHealthStatus(_request, response) {
  const db = await getDatabaseStatus()

  response.status(200).json({
    status: 'ok',
    db,
  })
}
