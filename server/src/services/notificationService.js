import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

const NOTIFICATION_SELECT = {
  createdAt: true,
  id: true,
  isRead: true,
  message: true,
  type: true,
}

function notificationNotFoundError() {
  return new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND')
}

function notificationForbiddenError() {
  return new AppError('You can only access your own notifications', 403, 'FORBIDDEN')
}

function isPrismaError(error, code) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

export async function listUserNotifications({ limit, page, userId }) {
  const where = { userId }
  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: NOTIFICATION_SELECT,
      skip: (page - 1) * limit,
      take: limit,
      where,
    }),
    prisma.notification.count({ where }),
  ])

  return {
    notifications,
    pagination: {
      limit,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function markUserNotificationRead({ notificationId, userId }) {
  const notification = await prisma.notification.findUnique({
    select: { id: true, userId: true },
    where: { id: notificationId },
  })

  if (!notification) {
    throw notificationNotFoundError()
  }

  if (notification.userId !== userId) {
    throw notificationForbiddenError()
  }

  try {
    return await prisma.notification.update({
      data: { isRead: true },
      select: NOTIFICATION_SELECT,
      where: { id: notificationId, userId },
    })
  } catch (error) {
    if (isPrismaError(error, 'P2025')) {
      throw notificationNotFoundError()
    }

    throw error
  }
}

export async function markAllUserNotificationsRead(userId) {
  const result = await prisma.notification.updateMany({
    data: { isRead: true },
    where: { isRead: false, userId },
  })

  return { updatedCount: result.count }
}
