import { AttemptResult, AttemptStatus, Role } from '@prisma/client'
import { AppError } from '../utils/AppError.js'
import { runSerializableTransaction } from '../utils/prismaTransactions.js'

const EVALUATED_ATTEMPT_WHERE = Object.freeze({
  status: AttemptStatus.EVALUATED,
})

function reportDataError() {
  return new AppError('Evaluated attempt data is incomplete', 500, 'REPORT_DATA_INVALID')
}

function runReportTransaction(operation) {
  return runSerializableTransaction(operation, {
    conflictCode: 'REPORT_TRANSACTION_CONFLICT',
    conflictMessage: 'The report data changed concurrently. Please retry.',
    timeoutCode: 'REPORT_TRANSACTION_TIMEOUT',
    timeoutMessage: 'The report could not be generated in time. Please retry.',
  })
}

function divideOrZero(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator
}

function ensureCompleteAggregate(aggregate, fields) {
  const total = aggregate._count._all

  if (fields.some((field) => aggregate._count[field] !== total)) {
    throw reportDataError()
  }

  return total
}

function ensureFiniteNumber(value) {
  if (!Number.isFinite(value)) {
    throw reportDataError()
  }

  return value
}

function summarizeAttemptResults(groups, expectedTotal) {
  let classifiedAttempts = 0
  let passedAttempts = 0

  for (const group of groups) {
    const count = group._count._all

    if (![AttemptResult.PASS, AttemptResult.FAIL].includes(group.result)) {
      throw reportDataError()
    }

    classifiedAttempts += count

    if (group.result === AttemptResult.PASS) {
      passedAttempts += count
    }
  }

  if (classifiedAttempts !== expectedTotal) {
    throw reportDataError()
  }

  return { passedAttempts }
}

export function getAdminOverviewReportData() {
  return runReportTransaction(async (transaction) => {
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalExams,
      evaluatedAggregate,
      resultGroups,
    ] = await Promise.all([
      transaction.user.count({ where: { role: Role.STUDENT } }),
      transaction.user.count({ where: { isActive: true, role: Role.STUDENT } }),
      transaction.user.count({ where: { role: Role.TEACHER } }),
      transaction.exam.count(),
      transaction.examAttempt.aggregate({
        _avg: { percentage: true, score: true },
        _count: {
          _all: true,
          percentage: true,
          result: true,
          score: true,
        },
        where: EVALUATED_ATTEMPT_WHERE,
      }),
      transaction.examAttempt.groupBy({
        _count: { _all: true },
        by: ['result'],
        where: EVALUATED_ATTEMPT_WHERE,
      }),
    ])
    const totalEvaluatedAttempts = ensureCompleteAggregate(evaluatedAggregate, [
      'percentage',
      'result',
      'score',
    ])
    const { passedAttempts } = summarizeAttemptResults(resultGroups, totalEvaluatedAttempts)
    const overallAverageScore =
      totalEvaluatedAttempts === 0 ? 0 : ensureFiniteNumber(evaluatedAggregate._avg.score)
    const overallAveragePercentage =
      totalEvaluatedAttempts === 0 ? 0 : ensureFiniteNumber(evaluatedAggregate._avg.percentage)

    return {
      activeStudents,
      overallAveragePercentage,
      overallAverageScore,
      overallPassPercentage: divideOrZero(passedAttempts, totalEvaluatedAttempts) * 100,
      totalEvaluatedAttempts,
      totalExams,
      totalStudents,
      totalTeachers,
    }
  })
}

export function getAdminSubjectWiseReportData() {
  return runReportTransaction(async (transaction) => {
    const [subjects, exams, evaluatedByExam, resultsByExam] = await Promise.all([
      transaction.subject.findMany({
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: { code: true, id: true, name: true },
      }),
      transaction.exam.findMany({
        select: { id: true, subjectId: true },
      }),
      transaction.examAttempt.groupBy({
        _count: { _all: true, percentage: true, score: true },
        _sum: { percentage: true, score: true },
        by: ['examId'],
        where: EVALUATED_ATTEMPT_WHERE,
      }),
      transaction.examAttempt.groupBy({
        _count: { _all: true },
        by: ['examId', 'result'],
        where: EVALUATED_ATTEMPT_WHERE,
      }),
    ])
    const reportBySubjectId = new Map(
      subjects.map((subject) => [
        subject.id,
        {
          passedAttempts: 0,
          percentageSum: 0,
          scoreSum: 0,
          totalEvaluatedAttempts: 0,
          totalExams: 0,
        },
      ]),
    )
    const subjectIdByExamId = new Map()

    for (const exam of exams) {
      const subjectReport = reportBySubjectId.get(exam.subjectId)

      if (!subjectReport) {
        throw reportDataError()
      }

      subjectIdByExamId.set(exam.id, exam.subjectId)
      subjectReport.totalExams += 1
    }

    const evaluatedCountByExamId = new Map()

    for (const aggregate of evaluatedByExam) {
      const totalEvaluatedAttempts = ensureCompleteAggregate(aggregate, ['percentage', 'score'])
      const subjectId = subjectIdByExamId.get(aggregate.examId)
      const subjectReport = reportBySubjectId.get(subjectId)

      if (!subjectReport || totalEvaluatedAttempts === 0) {
        throw reportDataError()
      }

      subjectReport.totalEvaluatedAttempts += totalEvaluatedAttempts
      subjectReport.percentageSum += ensureFiniteNumber(aggregate._sum.percentage)
      subjectReport.scoreSum += ensureFiniteNumber(aggregate._sum.score)
      evaluatedCountByExamId.set(aggregate.examId, totalEvaluatedAttempts)
    }

    const classifiedCountByExamId = new Map()

    for (const resultGroup of resultsByExam) {
      const subjectId = subjectIdByExamId.get(resultGroup.examId)
      const subjectReport = reportBySubjectId.get(subjectId)

      if (
        !subjectReport ||
        ![AttemptResult.PASS, AttemptResult.FAIL].includes(resultGroup.result)
      ) {
        throw reportDataError()
      }

      classifiedCountByExamId.set(
        resultGroup.examId,
        (classifiedCountByExamId.get(resultGroup.examId) ?? 0) + resultGroup._count._all,
      )

      if (resultGroup.result === AttemptResult.PASS) {
        subjectReport.passedAttempts += resultGroup._count._all
      }
    }

    for (const [examId, evaluatedCount] of evaluatedCountByExamId) {
      if (classifiedCountByExamId.get(examId) !== evaluatedCount) {
        throw reportDataError()
      }
    }

    return subjects.map((subject) => {
      const subjectReport = reportBySubjectId.get(subject.id)

      return {
        averagePercentage: divideOrZero(
          subjectReport.percentageSum,
          subjectReport.totalEvaluatedAttempts,
        ),
        averageScore: divideOrZero(subjectReport.scoreSum, subjectReport.totalEvaluatedAttempts),
        passPercentage:
          divideOrZero(subjectReport.passedAttempts, subjectReport.totalEvaluatedAttempts) * 100,
        subjectCode: subject.code,
        subjectId: subject.id,
        subjectName: subject.name,
        totalEvaluatedAttempts: subjectReport.totalEvaluatedAttempts,
        totalExams: subjectReport.totalExams,
      }
    })
  })
}

export function getAdminTopPerformersReportData() {
  return runReportTransaction(async (transaction) => {
    const aggregates = await transaction.examAttempt.groupBy({
      _avg: { percentage: true },
      _count: { _all: true, percentage: true },
      by: ['studentId'],
      where: {
        ...EVALUATED_ATTEMPT_WHERE,
        student: { is: { role: Role.STUDENT } },
      },
    })

    if (aggregates.length === 0) {
      return []
    }

    const students = await transaction.user.findMany({
      select: { id: true, name: true },
      where: {
        id: { in: aggregates.map((aggregate) => aggregate.studentId) },
        role: Role.STUDENT,
      },
    })
    const studentById = new Map(students.map((student) => [student.id, student]))

    const performers = aggregates.map((aggregate) => {
      const attemptCount = ensureCompleteAggregate(aggregate, ['percentage'])
      const student = studentById.get(aggregate.studentId)

      if (!student || attemptCount === 0) {
        throw reportDataError()
      }

      return {
        attemptCount,
        averagePercentage: ensureFiniteNumber(aggregate._avg.percentage),
        student,
      }
    })

    performers.sort((left, right) => {
      if (left.averagePercentage !== right.averagePercentage) {
        return right.averagePercentage - left.averagePercentage
      }

      if (left.attemptCount !== right.attemptCount) {
        return right.attemptCount - left.attemptCount
      }

      if (left.student.id === right.student.id) {
        return 0
      }

      return left.student.id < right.student.id ? -1 : 1
    })

    return performers.map((performer, index) => ({
      ...performer,
      rank: index + 1,
    }))
  })
}
