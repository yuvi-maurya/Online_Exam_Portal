import cron from 'node-cron'
import { AttemptStatus, ExamStatus, Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import {
  publishPendingGradingReminderSafely,
  publishUpcomingExamReminderSafely,
} from '../services/notificationDeliveryService.js'

const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1_000
const REMINDER_SCHEDULE = '0 * * * *'
const DELIVERY_BATCH_SIZE = 5
const REVIEWABLE_ATTEMPT_STATUSES = [
  AttemptStatus.SUBMITTED,
  AttemptStatus.AUTO_SUBMITTED,
  AttemptStatus.EVALUATED,
]

async function deliverInBatches(candidates, delivery) {
  let created = 0

  for (let index = 0; index < candidates.length; index += DELIVERY_BATCH_SIZE) {
    const batch = candidates.slice(index, index + DELIVERY_BATCH_SIZE)
    const results = await Promise.all(batch.map(delivery))

    created += results.filter((result) => result.created).length
  }

  return created
}

async function runUpcomingExamReminders(now) {
  const windowEnd = new Date(now.getTime() + UPCOMING_WINDOW_MS)
  const exams = await prisma.exam.findMany({
    orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      startTime: true,
      title: true,
    },
    where: {
      startTime: { gt: now, lte: windowEnd },
      status: ExamStatus.PUBLISHED,
    },
  })

  if (exams.length === 0) {
    return { created: 0, candidates: 0 }
  }

  const examIds = exams.map((exam) => exam.id)
  const students = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    select: {
      email: true,
      examAttempts: {
        select: { examId: true },
        where: { examId: { in: examIds } },
      },
      id: true,
      name: true,
    },
    where: {
      isActive: true,
      role: Role.STUDENT,
    },
  })
  const candidates = []

  for (const student of students) {
    const attemptedExamIds = new Set(student.examAttempts.map((attempt) => attempt.examId))

    for (const exam of exams) {
      if (attemptedExamIds.has(exam.id)) {
        continue
      }

      candidates.push({ exam, student })
    }
  }
  const created = await deliverInBatches(candidates, publishUpcomingExamReminderSafely)

  return { candidates: candidates.length, created }
}

async function runPendingGradingReminders() {
  const exams = await prisma.exam.findMany({
    orderBy: { id: 'asc' },
    select: {
      createdBy: {
        select: {
          email: true,
          id: true,
          name: true,
        },
      },
      id: true,
      title: true,
    },
    where: {
      attempts: {
        some: {
          answers: { some: { needsManualReview: true } },
          status: { in: REVIEWABLE_ATTEMPT_STATUSES },
        },
      },
      createdBy: {
        is: {
          isActive: true,
          role: Role.TEACHER,
        },
      },
    },
  })
  const candidates = exams.map((exam) => ({
    exam,
    teacher: exam.createdBy,
  }))
  const created = await deliverInBatches(candidates, ({ exam, teacher }) =>
    publishPendingGradingReminderSafely({
      exam,
      teacher,
    }),
  )

  return { candidates: candidates.length, created }
}

async function runReminderPhase(name, operation) {
  try {
    return await operation()
  } catch (error) {
    console.error(`${name} notification reminder phase failed:`, error)
    return { candidates: 0, created: 0, failed: true }
  }
}

export async function runNotificationReminderJob({ now = new Date() } = {}) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('now must be a valid Date')
  }

  const [upcomingExams, pendingGrading] = await Promise.all([
    runReminderPhase('Upcoming exam', () => runUpcomingExamReminders(now)),
    runReminderPhase('Pending grading', runPendingGradingReminders),
  ])

  return { pendingGrading, upcomingExams }
}

export function startNotificationReminderJob() {
  const task = cron.schedule(
    REMINDER_SCHEDULE,
    async () => {
      try {
        await runNotificationReminderJob()
      } catch (error) {
        console.error('Notification reminder job failed:', error)
      }
    },
    {
      name: 'exam-portal-notification-reminders',
      noOverlap: true,
      timezone: 'UTC',
      unref: true,
    },
  )

  console.info('Notification reminder job scheduled hourly')
  return task
}

export function shutdownNotificationReminderJobs(timeoutMs = 5_000) {
  return cron.shutdown(timeoutMs)
}
