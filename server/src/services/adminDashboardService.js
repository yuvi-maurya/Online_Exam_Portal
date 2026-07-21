import { Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'

export async function getAdminDashboardSummary() {
  const [totalStudents, totalTeachers, totalSubjects, totalExams] = await prisma.$transaction([
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.user.count({ where: { role: Role.TEACHER } }),
    prisma.subject.count(),
    prisma.exam.count(),
  ])

  return { totalExams, totalStudents, totalSubjects, totalTeachers }
}
