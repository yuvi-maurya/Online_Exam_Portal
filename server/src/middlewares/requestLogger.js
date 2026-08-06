import { randomUUID } from 'node:crypto'
import { logger } from '../config/logger.js'
import { requestContext } from '../utils/requestContext.js'

const REQUEST_ID_HEADER = 'x-request-id'
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,100}$/

function getRequestId(request) {
  const candidate = request.get(REQUEST_ID_HEADER)

  return candidate && SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID()
}

function getRouteName(request) {
  const routePath = request.route?.path

  if (typeof routePath !== 'string') {
    return '<unmatched>'
  }

  const pathname = request.originalUrl.split('?', 1)[0]
  const actualSegments = pathname.split('/').filter(Boolean)
  const routeSegments = routePath.split('/').filter(Boolean)
  const baseSegments = actualSegments.slice(
    0,
    Math.max(actualSegments.length - routeSegments.length, 0),
  )

  return `/${[...baseSegments, ...routeSegments].join('/')}`
}

export function requestLogger(request, response, next) {
  const requestId = getRequestId(request)
  const startedAt = process.hrtime.bigint()
  let logged = false

  request.id = requestId
  request.log = logger
  response.setHeader('X-Request-ID', requestId)

  const logCompletion = () => {
    if (logged) {
      return
    }

    logged = true
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const details = {
      durationMs: Number(durationMs.toFixed(2)),
      method: request.method,
      requestId,
      route: getRouteName(request),
      statusCode: response.statusCode,
    }

    if (response.statusCode >= 500) {
      request.log.error(details, 'Request completed')
    } else if (response.statusCode >= 400) {
      request.log.warn(details, 'Request completed')
    } else {
      request.log.info(details, 'Request completed')
    }
  }

  response.once('finish', logCompletion)
  response.once('close', logCompletion)
  requestContext.run({ requestId }, next)
}
