import {
  bulkImportQuestions as importQuestions,
  bulkImportStudents as importStudents,
} from '../services/bulkImportService.js'
import { parseQuestionImportFile, parseStudentImportFile } from '../utils/tabularImport.js'

export async function bulkImportStudents(request, response) {
  const { rows } = await parseStudentImportFile(request.file)
  const summary = await importStudents({
    actorId: request.user.userId,
    rows,
  })

  response.status(200).json({
    status: 'success',
    message: 'Student import completed.',
    data: { summary },
  })
}

export async function bulkImportQuestions(request, response) {
  const { rows } = await parseQuestionImportFile(request.file)
  const summary = await importQuestions({
    rows,
    teacherId: request.user.userId,
  })

  response.status(200).json({
    status: 'success',
    message: 'Question import completed.',
    data: { summary },
  })
}
