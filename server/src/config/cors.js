import { env } from './env.js'

const allowedOrigins = env.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 204,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    const error = new Error('Origin is not allowed by CORS')
    error.code = 'CORS_ORIGIN_DENIED'
    error.statusCode = 403
    callback(error)
  },
}
