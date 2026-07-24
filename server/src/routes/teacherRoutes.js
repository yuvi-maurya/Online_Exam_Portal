import { Role } from '@prisma/client'
import { Router } from 'express'
import {
  archiveExam,
  attachQuestions,
  createExam,
  deleteExam,
  detachQuestion,
  getExam,
  listExams,
  publishExam,
  scheduleExam,
  updateAttachedQuestion,
  updateExam,
} from '../controllers/teacherExamController.js'
import { getPendingGrading, gradeAnswer } from '../controllers/teacherEvaluationController.js'
import {
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
} from '../controllers/teacherQuestionController.js'
import { getExamReport } from '../controllers/teacherReportController.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

const teacherRouter = Router()

teacherRouter.use(requireAuth, requireRole(Role.TEACHER))

teacherRouter.post('/questions', createQuestion)
teacherRouter.get('/questions', listQuestions)
teacherRouter.get('/questions/:id', getQuestion)
teacherRouter.patch('/questions/:id', updateQuestion)
teacherRouter.delete('/questions/:id', deleteQuestion)

teacherRouter.post('/exams', createExam)
teacherRouter.get('/exams', listExams)
teacherRouter.post('/exams/:id/questions', attachQuestions)
teacherRouter.patch('/exams/:id/questions/:questionId', updateAttachedQuestion)
teacherRouter.delete('/exams/:id/questions/:questionId', detachQuestion)
teacherRouter.patch('/exams/:id/schedule', scheduleExam)
teacherRouter.patch('/exams/:id/publish', publishExam)
teacherRouter.patch('/exams/:id/archive', archiveExam)
teacherRouter.get('/exams/:id/pending-grading', getPendingGrading)
teacherRouter.get('/exams/:id/report', getExamReport)
teacherRouter.get('/exams/:id', getExam)
teacherRouter.patch('/exams/:id', updateExam)
teacherRouter.delete('/exams/:id', deleteExam)

teacherRouter.patch('/attempts/:attemptId/answers/:questionId/grade', gradeAnswer)

export default teacherRouter
