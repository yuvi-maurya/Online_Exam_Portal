import {
  createSubject as createSubjectRecord,
  deleteSubject as deleteSubjectRecord,
  getSubject as getSubjectRecord,
  listSubjects as listSubjectRecords,
  updateSubject as updateSubjectRecord,
} from '../services/subjectService.js'
import {
  validateResourceId,
  validateSubjectCreate,
  validateSubjectUpdate,
} from '../utils/adminValidation.js'

export async function createSubject(request, response) {
  const subject = await createSubjectRecord({
    createdById: request.user.userId,
    subject: validateSubjectCreate(request.body),
  })

  response.status(201).json({
    status: 'success',
    message: 'Subject created successfully.',
    data: { subject },
  })
}

export async function listSubjects(_request, response) {
  const subjects = await listSubjectRecords()

  response.status(200).json({
    status: 'success',
    data: { subjects },
  })
}

export async function getSubject(request, response) {
  const subject = await getSubjectRecord(validateResourceId(request.params.id))

  response.status(200).json({
    status: 'success',
    data: { subject },
  })
}

export async function updateSubject(request, response) {
  const subject = await updateSubjectRecord(
    validateResourceId(request.params.id),
    validateSubjectUpdate(request.body),
  )

  response.status(200).json({
    status: 'success',
    message: 'Subject updated successfully.',
    data: { subject },
  })
}

export async function deleteSubject(request, response) {
  const subject = await deleteSubjectRecord(validateResourceId(request.params.id))

  response.status(200).json({
    status: 'success',
    message: 'Subject deleted successfully.',
    data: { subject },
  })
}
