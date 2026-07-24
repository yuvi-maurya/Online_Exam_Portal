import { Role } from '@prisma/client'
import { Router } from 'express'
import { getAttempt, saveAnswer, submitAttempt } from '../controllers/studentAttemptController.js'
import { listExamHistory, listExams, startExam } from '../controllers/studentExamController.js'
import { getAttemptResult } from '../controllers/studentResultController.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

const studentRouter = Router()

studentRouter.use(requireAuth, requireRole(Role.STUDENT))

studentRouter.get('/exams/history', listExamHistory)
studentRouter.get('/exams', listExams)
studentRouter.post('/exams/:id/start', startExam)

studentRouter.patch('/attempts/:id/answers', saveAnswer)
studentRouter.post('/attempts/:id/submit', submitAttempt)
studentRouter.get('/attempts/:id/result', getAttemptResult)
studentRouter.get('/attempts/:id', getAttempt)

export default studentRouter
