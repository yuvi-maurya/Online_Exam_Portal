import { AttemptResult, AttemptStatus, Prisma } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

function examNotFoundError() {
  return new AppError('Exam not found', 404, 'EXAM_NOT_FOUND')
}

function examForbiddenError() {
  return new AppError('You can only view reports for exams you created', 403, 'FORBIDDEN')
}

function reportDataInvalidError() {
  return new AppError(
    'An evaluated attempt is missing required result data',
    500,
    'REPORT_DATA_INVALID',
  )
}

function assertCompleteEvaluatedAttempt(attempt) {
  if (
    attempt.evaluatedAt === null ||
    attempt.percentage === null ||
    !Number.isFinite(attempt.percentage) ||
    attempt.rank === null ||
    attempt.rank < 1 ||
    attempt.result === null ||
    attempt.score === null ||
    !Number.isFinite(attempt.score) ||
    attempt.submittedAt === null
  ) {
    throw reportDataInvalidError()
  }
}

function percentage(numerator, denominator) {
  return denominator === 0 ? 0 : (numerator / denominator) * 100
}

export async function getTeacherExamReport({ examId, teacherId }) {
  const exam = await prisma.exam.findUnique({
    select: {
      createdById: true,
      id: true,
      questions: {
        orderBy: { order: 'asc' },
        select: {
          marksOverride: true,
          order: true,
          question: {
            select: {
              id: true,
              marks: true,
              text: true,
              type: true,
            },
          },
          questionId: true,
        },
      },
      title: true,
      totalMarks: true,
    },
    where: { id: examId },
  })

  if (!exam) {
    throw examNotFoundError()
  }

  if (exam.createdById !== teacherId) {
    throw examForbiddenError()
  }

  const questionIds = exam.questions.map((attachment) => attachment.questionId)
  const [totalAttempts, evaluatedAttempts, correctCounts, presentationCounts] =
    await prisma.$transaction(
      [
        prisma.examAttempt.count({ where: { examId } }),
        prisma.examAttempt.findMany({
          orderBy: [{ rank: 'asc' }, { submittedAt: 'asc' }, { id: 'asc' }],
          select: {
            evaluatedAt: true,
            id: true,
            percentage: true,
            rank: true,
            result: true,
            score: true,
            student: { select: { id: true, name: true } },
            submittedAt: true,
          },
          where: { examId, status: AttemptStatus.EVALUATED },
        }),
        prisma.studentAnswer.groupBy({
          _count: { _all: true },
          by: ['questionId'],
          where: {
            attempt: { examId, status: AttemptStatus.EVALUATED },
            isCorrect: true,
            questionId: { in: questionIds },
          },
        }),
        prisma.attemptQuestion.groupBy({
          _count: { _all: true },
          by: ['questionId'],
          where: {
            attempt: { examId, status: AttemptStatus.EVALUATED },
            questionId: { in: questionIds },
          },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    )

  evaluatedAttempts.forEach(assertCompleteEvaluatedAttempt)

  const evaluatedCount = evaluatedAttempts.length
  const totalScore = evaluatedAttempts.reduce((sum, attempt) => sum + attempt.score, 0)
  const totalPercentage = evaluatedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0)
  const passCount = evaluatedAttempts.filter(
    (attempt) => attempt.result === AttemptResult.PASS,
  ).length
  const correctByQuestion = new Map(
    correctCounts.map((group) => [group.questionId, group._count._all]),
  )
  const presentationsByQuestion = new Map(
    presentationCounts.map((group) => [group.questionId, group._count._all]),
  )

  const questionAnalysis = exam.questions.map((attachment) => {
    const correctCount = correctByQuestion.get(attachment.questionId) ?? 0
    const attemptsAnalyzed = presentationsByQuestion.get(attachment.questionId) ?? 0

    if (correctCount > attemptsAnalyzed) {
      throw reportDataInvalidError()
    }

    return {
      attemptsAnalyzed,
      correctCount,
      incorrectCount: attemptsAnalyzed - correctCount,
      maxMarks: attachment.marksOverride ?? attachment.question.marks,
      order: attachment.order,
      questionId: attachment.questionId,
      questionText: attachment.question.text,
      questionType: attachment.question.type,
    }
  })

  return {
    exam: {
      id: exam.id,
      title: exam.title,
      totalMarks: exam.totalMarks,
    },
    questionAnalysis,
    rankedResults: evaluatedAttempts.map((attempt) => ({
      percentage: attempt.percentage,
      rank: attempt.rank,
      score: attempt.score,
      student: attempt.student,
    })),
    summary: {
      averagePercentage: evaluatedCount === 0 ? 0 : totalPercentage / evaluatedCount,
      averageScore: evaluatedCount === 0 ? 0 : totalScore / evaluatedCount,
      evaluatedCount,
      passPercentage: percentage(passCount, evaluatedCount),
      pendingCount: totalAttempts - evaluatedCount,
      totalAttempts,
    },
  }
}
