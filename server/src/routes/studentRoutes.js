import { Role } from '@prisma/client'
import { Router } from 'express'
import { getCertificate, listCertificates } from '../controllers/certificateController.js'
import {
  getAttempt,
  recordViolation,
  saveAnswer,
  submitAttempt,
} from '../controllers/studentAttemptController.js'
import { listExamHistory, listExams, startExam } from '../controllers/studentExamController.js'
import { getAttemptResult } from '../controllers/studentResultController.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

const studentRouter = Router()

studentRouter.use(requireAuth, requireRole(Role.STUDENT))

studentRouter.get('/certificates', listCertificates)
studentRouter.get('/certificates/:id', getCertificate)

studentRouter.get('/exams/history', listExamHistory)
studentRouter.get('/exams', listExams)
studentRouter.post('/exams/:id/start', startExam)

studentRouter.patch('/attempts/:id/answers', saveAnswer)
studentRouter.patch('/attempts/:id/violation', recordViolation)
studentRouter.post('/attempts/:id/submit', submitAttempt)
studentRouter.get('/attempts/:id/result', getAttemptResult)
studentRouter.get('/attempts/:id', getAttempt)

export default studentRouter
