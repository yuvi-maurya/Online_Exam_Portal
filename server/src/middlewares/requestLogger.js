import morgan from 'morgan'
import { env } from '../config/env.js'

const format = env.nodeEnv === 'production' ? 'combined' : 'dev'

export const requestLogger = morgan(format, {
  skip: () => env.nodeEnv === 'test',
})
