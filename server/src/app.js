import cors from 'cors'
import express from 'express'
import { corsOptions } from './config/cors.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { notFoundHandler } from './middlewares/notFoundHandler.js'
import { requestLogger } from './middlewares/requestLogger.js'
import apiRouter from './routes/index.js'

export const app = express()

app.disable('x-powered-by')
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(requestLogger)

app.use('/api', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)
