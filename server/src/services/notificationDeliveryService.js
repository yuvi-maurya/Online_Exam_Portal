import { createHash } from 'node:crypto'
import { AttemptStatus } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import {
  sendPendingGradingReminderEmail,
  sendResultReadyEmail,
  sendUpcomingExamReminderEmail,
} from './emailService.js'

export const NotificationType = Object.freeze({
  PENDING_GRADING_REMINDER: 'PENDING_GRADING_REMINDER',
  RESULT_PUBLISHED: 'RESULT_PUBLISHED',
  UPCOMING_EXAM_REMINDER: 'UPCOMING_EXAM_REMINDER',
})

function formatPercentage(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Evaluated attempt percentage is unavailable')
  }

  return Number(value.toFixed(2)).toString()
}

function notificationEventId({ resourceId, type, userId }) {
  const digest = createHash('sha256')
    .update(JSON.stringify([type, userId, resourceId]))
    .digest('hex')
    .slice(0, 32)

  return `notification_${digest}`
}

function logDeliveryFailure({ error, resourceId, stage, type }) {
  console.error(`Notification ${stage} failed for ${type} event on resource ${resourceId}:`, error)
}

async function deliverNotificationOnce({ emailDelivery, message, resourceId, type, userId }) {
  const id = notificationEventId({ resourceId, type, userId })
  const creation = await prisma.notification.createMany({
    data: {
      id,
      isRead: false,
      message,
      type,
      userId,
    },
    skipDuplicates: true,
  })

  if (creation.count === 0) {
    return { created: false, emailSent: false }
  }

  try {
    await emailDelivery()
    return { created: true, emailSent: true }
  } catch (error) {
    logDeliveryFailure({ error, resourceId, stage: 'email delivery', type })
    return { created: true, emailSent: false }
  }
}

export async function publishResultNotificationSafely(attemptId) {
  try {
    const attempt = await prisma.examAttempt.findUnique({
      select: {
        exam: { select: { title: true } },
        percentage: true,
        status: true,
        student: { select: { email: true, id: true, name: true } },
      },
      where: { id: attemptId },
    })

    if (!attempt || attempt.status !== AttemptStatus.EVALUATED) {
      return { created: false, emailSent: false }
    }

    const percentage = formatPercentage(attempt.percentage)
    const message = `Your result for ${attempt.exam.title} is ready — you scored ${percentage}%.`

    return await deliverNotificationOnce({
      emailDelivery: () =>
        sendResultReadyEmail({
          examTitle: attempt.exam.title,
          name: attempt.student.name,
          percentage,
          to: attempt.student.email,
        }),
      message,
      resourceId: attemptId,
      type: NotificationType.RESULT_PUBLISHED,
      userId: attempt.student.id,
    })
  } catch (error) {
    logDeliveryFailure({
      error,
      resourceId: attemptId,
      stage: 'creation',
      type: NotificationType.RESULT_PUBLISHED,
    })
    return { created: false, emailSent: false }
  }
}

export async function publishUpcomingExamReminderSafely({ exam, student }) {
  try {
    const scheduledStart = exam.startTime.toISOString()
    const message = `${exam.title} starts at ${scheduledStart}. Sign in early and be ready to begin.`

    return await deliverNotificationOnce({
      emailDelivery: () =>
        sendUpcomingExamReminderEmail({
          examTitle: exam.title,
          name: student.name,
          scheduledStart,
          to: student.email,
        }),
      message,
      resourceId: exam.id,
      type: NotificationType.UPCOMING_EXAM_REMINDER,
      userId: student.id,
    })
  } catch (error) {
    logDeliveryFailure({
      error,
      resourceId: exam.id,
      stage: 'creation',
      type: NotificationType.UPCOMING_EXAM_REMINDER,
    })
    return { created: false, emailSent: false }
  }
}

export async function publishPendingGradingReminderSafely({ exam, teacher }) {
  try {
    const message = `${exam.title} has student answers waiting for manual grading.`

    return await deliverNotificationOnce({
      emailDelivery: () =>
        sendPendingGradingReminderEmail({
          examTitle: exam.title,
          name: teacher.name,
          to: teacher.email,
        }),
      message,
      resourceId: exam.id,
      type: NotificationType.PENDING_GRADING_REMINDER,
      userId: teacher.id,
    })
  } catch (error) {
    logDeliveryFailure({
      error,
      resourceId: exam.id,
      stage: 'creation',
      type: NotificationType.PENDING_GRADING_REMINDER,
    })
    return { created: false, emailSent: false }
  }
}
