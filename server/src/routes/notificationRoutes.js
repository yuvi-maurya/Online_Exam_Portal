import { Router } from 'express'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js'
import { requireAuth } from '../middlewares/auth.js'

const notificationRouter = Router()

notificationRouter.use(requireAuth)

notificationRouter.get('/', listNotifications)
notificationRouter.patch('/read-all', markAllNotificationsRead)
notificationRouter.patch('/:id/read', markNotificationRead)

export default notificationRouter
