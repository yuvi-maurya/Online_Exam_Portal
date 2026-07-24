import { Role } from '@prisma/client'
import { Router } from 'express'
import { getAdminDashboard } from '../controllers/adminDashboardController.js'
import {
  getAdminOverviewReport,
  getAdminSubjectWiseReport,
  getAdminTopPerformersReport,
} from '../controllers/adminReportController.js'
import { createManagedUserController } from '../controllers/adminUserController.js'
import {
  createSubject,
  deleteSubject,
  getSubject,
  listSubjects,
  updateSubject,
} from '../controllers/subjectController.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

const adminRouter = Router()
const studentController = createManagedUserController({
  collectionKey: 'students',
  label: 'Student',
  resourceKey: 'student',
  role: Role.STUDENT,
})
const teacherController = createManagedUserController({
  collectionKey: 'teachers',
  label: 'Teacher',
  resourceKey: 'teacher',
  role: Role.TEACHER,
})

adminRouter.use(requireAuth, requireRole(Role.ADMIN))

adminRouter.get('/dashboard', getAdminDashboard)
adminRouter.get('/reports/overview', getAdminOverviewReport)
adminRouter.get('/reports/subject-wise', getAdminSubjectWiseReport)
adminRouter.get('/reports/top-performers', getAdminTopPerformersReport)

adminRouter.post('/students', studentController.create)
adminRouter.get('/students', studentController.list)
adminRouter.get('/students/:id', studentController.getOne)
adminRouter.patch('/students/:id', studentController.update)
adminRouter.patch('/students/:id/deactivate', studentController.deactivate)
adminRouter.patch('/students/:id/activate', studentController.activate)

adminRouter.post('/teachers', teacherController.create)
adminRouter.get('/teachers', teacherController.list)
adminRouter.get('/teachers/:id', teacherController.getOne)
adminRouter.patch('/teachers/:id', teacherController.update)
adminRouter.patch('/teachers/:id/deactivate', teacherController.deactivate)
adminRouter.patch('/teachers/:id/activate', teacherController.activate)

adminRouter.post('/subjects', createSubject)
adminRouter.get('/subjects', listSubjects)
adminRouter.get('/subjects/:id', getSubject)
adminRouter.patch('/subjects/:id', updateSubject)
adminRouter.delete('/subjects/:id', deleteSubject)

export default adminRouter
