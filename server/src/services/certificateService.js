import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { reconcileStudentCertificatesSafely } from './certificateIssuanceService.js'

const STUDENT_CERTIFICATE_SELECT = {
  certificateCode: true,
  exam: { select: { id: true, title: true } },
  fileUrl: true,
  id: true,
  issuedAt: true,
}

function certificateNotFoundError() {
  return new AppError('Certificate not found', 404, 'CERTIFICATE_NOT_FOUND')
}

export async function listStudentCertificates(studentId) {
  await reconcileStudentCertificatesSafely(studentId)

  return prisma.certificate.findMany({
    orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
    select: STUDENT_CERTIFICATE_SELECT,
    where: { studentId },
  })
}

export async function getStudentCertificate({ certificateId, studentId }) {
  const certificate = await prisma.certificate.findUnique({
    select: {
      ...STUDENT_CERTIFICATE_SELECT,
      studentId: true,
    },
    where: { id: certificateId },
  })

  if (!certificate) {
    throw certificateNotFoundError()
  }

  if (certificate.studentId !== studentId) {
    throw new AppError('You can only access your own certificates', 403, 'FORBIDDEN')
  }

  return {
    certificateCode: certificate.certificateCode,
    exam: certificate.exam,
    fileUrl: certificate.fileUrl,
    id: certificate.id,
    issuedAt: certificate.issuedAt,
  }
}

export async function verifyCertificate(certificateCode) {
  if (!certificateCode) {
    throw certificateNotFoundError()
  }

  const certificate = await prisma.certificate.findUnique({
    select: {
      exam: { select: { title: true } },
      issuedAt: true,
      student: { select: { name: true } },
    },
    where: { certificateCode },
  })

  if (!certificate) {
    throw certificateNotFoundError()
  }

  return {
    examTitle: certificate.exam.title,
    issuedAt: certificate.issuedAt,
    studentName: certificate.student.name,
    valid: true,
  }
}
