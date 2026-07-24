import {
  listUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
} from '../services/notificationService.js'
import {
  validateNotificationId,
  validateNotificationPagination,
} from '../utils/notificationValidation.js'

export async function listNotifications(request, response) {
  const result = await listUserNotifications({
    ...validateNotificationPagination(request.query),
    userId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: result,
  })
}

export async function markNotificationRead(request, response) {
  const notification = await markUserNotificationRead({
    notificationId: validateNotificationId(request.params.id),
    userId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Notification marked as read.',
    data: { notification },
  })
}

export async function markAllNotificationsRead(request, response) {
  const result = await markAllUserNotificationsRead(request.user.userId)

  response.status(200).json({
    status: 'success',
    message: 'All notifications marked as read.',
    data: result,
  })
}
