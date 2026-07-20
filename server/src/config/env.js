import 'dotenv/config'

const parsedPort = Number.parseInt(process.env.PORT ?? '5000', 10)

if (Number.isNaN(parsedPort)) {
  throw new Error('PORT must be a valid integer')
}

export const env = Object.freeze({
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsedPort,
})
