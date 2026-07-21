import { Router } from 'express'
import adminRouter from './adminRoutes.js'
import authRouter from './authRoutes.js'
import healthRouter from './healthRoutes.js'

const apiRouter = Router()

apiRouter.use('/admin', adminRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/health', healthRouter)

export default apiRouter
