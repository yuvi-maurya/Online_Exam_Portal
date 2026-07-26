import {
  getStudentCertificate,
  listStudentCertificates,
  verifyCertificate,
} from '../services/certificateService.js'
import { normalizeCertificateCode } from '../utils/certificateValidation.js'
import { validateStudentResourceId } from '../utils/studentValidation.js'

export async function listCertificates(request, response) {
  const certificates = await listStudentCertificates(request.user.userId)

  response.status(200).json({
    status: 'success',
    data: { certificates },
  })
}

export async function getCertificate(request, response) {
  const certificate = await getStudentCertificate({
    certificateId: validateStudentResourceId(request.params.id, 'certificateId'),
    studentId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    data: { certificate },
  })
}

export async function verifyCertificateCode(request, response) {
  const verification = await verifyCertificate(
    normalizeCertificateCode(request.params.certificateCode),
  )

  response.status(200).json({
    status: 'success',
    data: verification,
  })
}
