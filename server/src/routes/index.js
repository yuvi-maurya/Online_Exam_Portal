import { Router } from 'express'
import adminRouter from './adminRoutes.js'
import authRouter from './authRoutes.js'
import healthRouter from './healthRoutes.js'
import teacherRouter from './teacherRoutes.js'

const apiRouter = Router()

apiRouter.use('/admin', adminRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/health', healthRouter)
apiRouter.use('/teacher', teacherRouter)

export default apiRouter
