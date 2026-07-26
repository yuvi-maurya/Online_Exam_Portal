import 'dotenv/config'

const parsedPort = Number.parseInt(process.env.PORT ?? '5000', 10)
const parsedSmtpPort = Number.parseInt(process.env.SMTP_PORT ?? '587', 10)

function parseBoolean(value, name, defaultValue = false) {
  if (value === undefined) {
    return defaultValue
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'true') {
    return true
  }

  if (normalized === 'false') {
    return false
  }

  throw new Error(`${name} must be true or false`)
}

if (Number.isNaN(parsedPort)) {
  throw new Error('PORT must be a valid integer')
}

if (Number.isNaN(parsedSmtpPort)) {
  throw new Error('SMTP_PORT must be a valid integer')
}

export const env = Object.freeze({
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  cloudinary: Object.freeze({
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  }),
  enableCronJobs: parseBoolean(process.env.ENABLE_CRON_JOBS, 'ENABLE_CRON_JOBS'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsedPort,
  smtp: Object.freeze({
    host: process.env.SMTP_HOST,
    pass: process.env.SMTP_PASS,
    port: parsedSmtpPort,
    secure: parsedSmtpPort === 465,
    user: process.env.SMTP_USER,
  }),
})
