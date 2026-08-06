const FORMULA_PREFIX_PATTERN = /^\s*[=+\-@]/

function normalizeCsvValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const normalized = String(value)

  if (typeof value === 'string' && FORMULA_PREFIX_PATTERN.test(normalized)) {
    return `'${normalized}`
  }

  return normalized
}

function escapeCsvValue(value) {
  const normalized = normalizeCsvValue(value)

  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`
  }

  return normalized
}

export function serializeCsvRows(columns, rows) {
  const lines = [columns.map((column) => escapeCsvValue(column.header)).join(',')]

  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsvValue(row[column.key])).join(','))
  }

  return `\uFEFF${lines.join('\r\n')}\r\n`
}

export function buildAdminOverviewCsv(overview) {
  return serializeCsvRows(
    [
      { header: 'Total Students', key: 'totalStudents' },
      { header: 'Active Students', key: 'activeStudents' },
      { header: 'Total Teachers', key: 'totalTeachers' },
      { header: 'Total Exams', key: 'totalExams' },
      { header: 'Total Evaluated Attempts', key: 'totalEvaluatedAttempts' },
      { header: 'Overall Average Score', key: 'overallAverageScore' },
      { header: 'Overall Average Percentage', key: 'overallAveragePercentage' },
      { header: 'Overall Pass Percentage', key: 'overallPassPercentage' },
    ],
    [overview],
  )
}

export function buildAdminSubjectWiseCsv(subjects) {
  return serializeCsvRows(
    [
      { header: 'Subject ID', key: 'subjectId' },
      { header: 'Subject Code', key: 'subjectCode' },
      { header: 'Subject Name', key: 'subjectName' },
      { header: 'Total Exams', key: 'totalExams' },
      { header: 'Total Evaluated Attempts', key: 'totalEvaluatedAttempts' },
      { header: 'Average Score', key: 'averageScore' },
      { header: 'Average Percentage', key: 'averagePercentage' },
      { header: 'Pass Percentage', key: 'passPercentage' },
    ],
    subjects,
  )
}

export function buildTeacherExamReportCsv(report) {
  const examFields = {
    examId: report.exam.id,
    examTitle: report.exam.title,
    totalMarks: report.exam.totalMarks,
  }
  const rows = [
    {
      ...examFields,
      averagePercentage: report.summary.averagePercentage,
      averageScore: report.summary.averageScore,
      evaluatedCount: report.summary.evaluatedCount,
      passPercentage: report.summary.passPercentage,
      pendingCount: report.summary.pendingCount,
      recordType: 'SUMMARY',
      totalAttempts: report.summary.totalAttempts,
    },
    ...report.questionAnalysis.map((question) => ({
      ...examFields,
      attemptsAnalyzed: question.attemptsAnalyzed,
      correctCount: question.correctCount,
      incorrectCount: question.incorrectCount,
      maxMarks: question.maxMarks,
      questionId: question.questionId,
      questionOrder: question.order,
      questionText: question.questionText,
      questionType: question.questionType,
      recordType: 'QUESTION_ANALYSIS',
    })),
    ...report.rankedResults.map((result) => ({
      ...examFields,
      percentage: result.percentage,
      rank: result.rank,
      recordType: 'RANKED_RESULT',
      score: result.score,
      studentId: result.student.id,
      studentName: result.student.name,
    })),
  ]

  return serializeCsvRows(
    [
      { header: 'Record Type', key: 'recordType' },
      { header: 'Exam ID', key: 'examId' },
      { header: 'Exam Title', key: 'examTitle' },
      { header: 'Total Marks', key: 'totalMarks' },
      { header: 'Total Attempts', key: 'totalAttempts' },
      { header: 'Evaluated Count', key: 'evaluatedCount' },
      { header: 'Pending Count', key: 'pendingCount' },
      { header: 'Average Score', key: 'averageScore' },
      { header: 'Average Percentage', key: 'averagePercentage' },
      { header: 'Pass Percentage', key: 'passPercentage' },
      { header: 'Question ID', key: 'questionId' },
      { header: 'Question Order', key: 'questionOrder' },
      { header: 'Question Text', key: 'questionText' },
      { header: 'Question Type', key: 'questionType' },
      { header: 'Max Marks', key: 'maxMarks' },
      { header: 'Attempts Analyzed', key: 'attemptsAnalyzed' },
      { header: 'Correct Count', key: 'correctCount' },
      { header: 'Incorrect Count', key: 'incorrectCount' },
      { header: 'Rank', key: 'rank' },
      { header: 'Student ID', key: 'studentId' },
      { header: 'Student Name', key: 'studentName' },
      { header: 'Score', key: 'score' },
      { header: 'Percentage', key: 'percentage' },
    ],
    rows,
  )
}

export function sendCsvDownload(response, filename, csv) {
  response
    .status(200)
    .set({
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    })
    .send(csv)
}
