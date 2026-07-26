import { Router } from 'express'
import adminRouter from './adminRoutes.js'
import authRouter from './authRoutes.js'
import certificateRouter from './certificateRoutes.js'
import healthRouter from './healthRoutes.js'
import notificationRouter from './notificationRoutes.js'
import studentRouter from './studentRoutes.js'
import teacherRouter from './teacherRoutes.js'

const apiRouter = Router()

apiRouter.use('/admin', adminRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/certificates', certificateRouter)
apiRouter.use('/health', healthRouter)
apiRouter.use('/notifications', notificationRouter)
apiRouter.use('/student', studentRouter)
apiRouter.use('/teacher', teacherRouter)

export default apiRouter
