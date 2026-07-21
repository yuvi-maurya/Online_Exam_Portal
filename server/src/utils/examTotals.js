import { AppError } from './AppError.js'

const MAX_EXAM_TOTAL_MARKS = 2_147_483_647

export async function recomputeExamTotalMarks(examId, transaction) {
  const attachments = await transaction.examQuestion.findMany({
    select: {
      marksOverride: true,
      question: { select: { marks: true } },
    },
    where: { examId },
  })

  let totalMarks = 0

  for (const attachment of attachments) {
    totalMarks += attachment.marksOverride ?? attachment.question.marks

    if (!Number.isSafeInteger(totalMarks) || totalMarks > MAX_EXAM_TOTAL_MARKS) {
      throw new AppError(
        `Exam total marks cannot exceed ${MAX_EXAM_TOTAL_MARKS}`,
        400,
        'EXAM_TOTAL_MARKS_LIMIT_EXCEEDED',
      )
    }
  }

  await transaction.exam.update({
    data: { totalMarks },
    where: { id: examId },
  })

  return { questionCount: attachments.length, totalMarks }
}
