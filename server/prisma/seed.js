import { PrismaClient, Role } from '@prisma/client'
import { logger } from '../src/config/logger.js'
import { hashPassword } from '../src/utils/password.js'

const prisma = new PrismaClient()

const users = [
  {
    email: 'admin@examportal.local',
    isActive: true,
    isEmailVerified: true,
    name: 'Portal Admin',
    password: 'plain-placeholder-admin-password',
    role: Role.ADMIN,
  },
  {
    email: 'teacher@examportal.local',
    isActive: true,
    isEmailVerified: true,
    name: 'Demo Teacher',
    password: 'plain-placeholder-teacher-password',
    role: Role.TEACHER,
  },
  {
    email: 'student@examportal.local',
    isActive: true,
    isEmailVerified: true,
    name: 'Demo Student',
    password: 'plain-placeholder-student-password',
    role: Role.STUDENT,
  },
]

async function upsertUser({ password, ...user }) {
  const passwordHash = await hashPassword(password)

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      password: passwordHash,
      role: user.role,
    },
    create: {
      ...user,
      password: passwordHash,
    },
  })
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo data seeding is disabled in production')
  }

  const seededUsers = []

  for (const user of users) {
    seededUsers.push(await upsertUser(user))
  }

  const [admin, teacher, student] = seededUsers

  const subject = await prisma.subject.upsert({
    where: { code: 'CS101' },
    update: {
      createdById: teacher.id,
      description: 'Foundational computer science concepts for Exam Portal development.',
      name: 'Computer Science Fundamentals',
    },
    create: {
      code: 'CS101',
      createdById: teacher.id,
      description: 'Foundational computer science concepts for Exam Portal development.',
      name: 'Computer Science Fundamentals',
    },
  })

  logger.info(
    {
      roles: [admin.role, teacher.role, student.role],
      subjectCode: subject.code,
      userCount: seededUsers.length,
    },
    'Demo data seeded',
  )
}

try {
  await main()
} catch (error) {
  logger.error({ err: error }, 'Database seeding failed')
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
