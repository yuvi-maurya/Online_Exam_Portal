const dateTime = { format: 'date-time', type: 'string' }
const nullableDateTime = { ...dateTime, nullable: true }
const nullableNumber = { nullable: true, type: 'number' }
const nullableInteger = { nullable: true, type: 'integer' }
const nullableString = { nullable: true, type: 'string' }

const object = (properties, required = Object.keys(properties), additionalProperties = false) => ({
  additionalProperties,
  properties,
  required,
  type: 'object',
})

const stringEnum = (values) => ({ enum: values, type: 'string' })
const id = { maxLength: 100, minLength: 1, type: 'string' }

const role = stringEnum(['ADMIN', 'TEACHER', 'STUDENT'])
const questionType = stringEnum([
  'MCQ',
  'TRUE_FALSE',
  'FILL_BLANK',
  'SHORT_ANSWER',
  'ESSAY',
  'CODING',
])
const difficulty = stringEnum(['EASY', 'MEDIUM', 'HARD'])
const examType = stringEnum(['PRACTICE', 'MOCK', 'FINAL', 'QUIZ', 'DAILY', 'WEEKLY'])
const examStatus = stringEnum(['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'ARCHIVED'])
const attemptStatus = stringEnum(['IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'])
const attemptResult = { enum: ['PASS', 'FAIL'], nullable: true, type: 'string' }

const pagination = object({
  limit: { minimum: 1, type: 'integer' },
  page: { minimum: 1, type: 'integer' },
  total: { minimum: 0, type: 'integer' },
  totalPages: { minimum: 0, type: 'integer' },
})

const publicUser = object({
  email: { format: 'email', type: 'string' },
  id,
  name: { type: 'string' },
  role,
})

const registrationUser = object({
  ...publicUser.properties,
  isEmailVerified: { type: 'boolean' },
})

const managedUser = object({
  createdAt: dateTime,
  email: { format: 'email', type: 'string' },
  id,
  isActive: { type: 'boolean' },
  isEmailVerified: { type: 'boolean' },
  name: { type: 'string' },
  role,
  updatedAt: dateTime,
})

const subject = object({
  code: { type: 'string' },
  createdAt: dateTime,
  createdById: id,
  description: nullableString,
  id,
  name: { type: 'string' },
})

const subjectSummary = object({
  code: { type: 'string' },
  id,
  name: { type: 'string' },
})

const questionOption = object({
  id,
  isCorrect: { type: 'boolean' },
  order: { minimum: 0, type: 'integer' },
  text: { type: 'string' },
})

const question = object({
  content: { type: 'string' },
  correctAnswerText: nullableString,
  createdAt: dateTime,
  createdById: id,
  difficulty,
  id,
  marks: { minimum: 1, type: 'integer' },
  options: { items: questionOption, type: 'array' },
  subjectId: id,
  type: questionType,
})

const questionSummary = object(
  {
    content: { type: 'string' },
    correctAnswerText: nullableString,
    difficulty,
    id,
    marks: { minimum: 1, type: 'integer' },
    options: { items: questionOption, type: 'array' },
    subjectId: id,
    type: questionType,
  },
  ['content', 'correctAnswerText', 'difficulty', 'id', 'marks', 'options', 'subjectId', 'type'],
)

const examQuestion = object({
  id,
  marks: { minimum: 1, type: 'integer' },
  order: { minimum: 0, type: 'integer' },
  question: questionSummary,
  questionId: id,
})

const exam = object(
  {
    attemptCount: { minimum: 0, type: 'integer' },
    createdAt: dateTime,
    createdById: id,
    durationMinutes: { maximum: 1440, minimum: 1, type: 'integer' },
    fullScreenRequired: { type: 'boolean' },
    id,
    passingMarks: { minimum: 0, type: 'integer' },
    questionCount: { minimum: 0, type: 'integer' },
    questions: { items: examQuestion, type: 'array' },
    scheduledEnd: nullableDateTime,
    scheduledStart: nullableDateTime,
    shuffleOptions: { type: 'boolean' },
    shuffleQuestions: { type: 'boolean' },
    status: examStatus,
    subjectId: id,
    tabSwitchLimit: nullableInteger,
    title: { type: 'string' },
    totalMarks: { minimum: 0, type: 'integer' },
    type: examType,
    webcamMonitoring: { type: 'boolean' },
  },
  [
    'createdAt',
    'createdById',
    'durationMinutes',
    'fullScreenRequired',
    'id',
    'passingMarks',
    'scheduledEnd',
    'scheduledStart',
    'shuffleOptions',
    'shuffleQuestions',
    'status',
    'subjectId',
    'tabSwitchLimit',
    'title',
    'totalMarks',
    'type',
    'webcamMonitoring',
  ],
)

const studentExam = object({
  durationMinutes: { type: 'integer' },
  fullScreenRequired: { type: 'boolean' },
  id,
  passingMarks: { type: 'integer' },
  scheduledEnd: nullableDateTime,
  scheduledStart: nullableDateTime,
  shuffleOptions: { type: 'boolean' },
  shuffleQuestions: { type: 'boolean' },
  status: examStatus,
  subject: subjectSummary,
  tabSwitchLimit: nullableInteger,
  title: { type: 'string' },
  totalMarks: { type: 'integer' },
  type: examType,
  webcamMonitoring: { type: 'boolean' },
})

const attemptSummary = object({
  evaluatedAt: nullableDateTime,
  id,
  percentage: nullableNumber,
  rank: nullableInteger,
  result: attemptResult,
  score: nullableNumber,
  startedAt: dateTime,
  status: attemptStatus,
  submittedAt: nullableDateTime,
  timeTakenSeconds: nullableInteger,
})

const studentAnswer = object({
  answerText: nullableString,
  questionId: id,
  selectedOptionId: nullableString,
})

const studentAttemptQuestionOption = object({
  id,
  order: { minimum: 0, type: 'integer' },
  text: { type: 'string' },
})

const studentAttemptQuestion = object({
  content: { type: 'string' },
  difficulty,
  id,
  marks: { minimum: 1, type: 'integer' },
  options: { items: studentAttemptQuestionOption, type: 'array' },
  order: { minimum: 0, type: 'integer' },
  type: questionType,
})

const studentAttempt = object({
  answers: { items: studentAnswer, type: 'array' },
  deadlineAt: dateTime,
  exam: studentExam,
  id,
  questions: { items: studentAttemptQuestion, type: 'array' },
  startedAt: dateTime,
  status: attemptStatus,
  submittedAt: nullableDateTime,
  tabSwitchCount: { minimum: 0, type: 'integer' },
  timeTakenSeconds: nullableInteger,
})

const attemptEvaluationState = object({
  evaluatedAt: nullableDateTime,
  id,
  percentage: nullableNumber,
  rank: nullableInteger,
  result: attemptResult,
  score: nullableNumber,
  startedAt: dateTime,
  status: attemptStatus,
  submittedAt: nullableDateTime,
  timeTakenSeconds: nullableInteger,
})

const certificate = object({
  certificateCode: { pattern: '^[A-Z0-9]{20}$', type: 'string' },
  exam: object({ id, title: { type: 'string' } }),
  fileUrl: { format: 'uri', type: 'string' },
  id,
  issuedAt: dateTime,
})

const notification = object({
  createdAt: dateTime,
  id,
  isRead: { type: 'boolean' },
  message: { type: 'string' },
  type: { type: 'string' },
})

const importIssue = object({
  code: { type: 'string' },
  reason: { type: 'string' },
  row: { minimum: 2, type: 'integer' },
})

const importSummary = object({
  createdCount: { minimum: 0, type: 'integer' },
  skippedCount: { minimum: 0, type: 'integer' },
  skippedRows: { items: importIssue, type: 'array' },
  totalRows: { minimum: 1, type: 'integer' },
  warningCount: { minimum: 0, type: 'integer' },
  warningRows: { items: importIssue, type: 'array' },
})

const overviewReport = object({
  activeStudents: { minimum: 0, type: 'integer' },
  overallAveragePercentage: { type: 'number' },
  overallAverageScore: { type: 'number' },
  overallPassPercentage: { type: 'number' },
  totalEvaluatedAttempts: { minimum: 0, type: 'integer' },
  totalExams: { minimum: 0, type: 'integer' },
  totalStudents: { minimum: 0, type: 'integer' },
  totalTeachers: { minimum: 0, type: 'integer' },
})

const subjectReport = object({
  averagePercentage: { type: 'number' },
  averageScore: { type: 'number' },
  passPercentage: { type: 'number' },
  subjectCode: { type: 'string' },
  subjectId: id,
  subjectName: { type: 'string' },
  totalEvaluatedAttempts: { minimum: 0, type: 'integer' },
  totalExams: { minimum: 0, type: 'integer' },
})

const teacherReport = object({
  exam: object({ id, title: { type: 'string' }, totalMarks: { type: 'integer' } }),
  questionAnalysis: {
    items: object({
      attemptsAnalyzed: { minimum: 0, type: 'integer' },
      correctCount: { minimum: 0, type: 'integer' },
      incorrectCount: { minimum: 0, type: 'integer' },
      maxMarks: { minimum: 1, type: 'integer' },
      order: { minimum: 0, type: 'integer' },
      questionId: id,
      questionText: { type: 'string' },
      questionType,
    }),
    type: 'array',
  },
  rankedResults: {
    items: object({
      percentage: { type: 'number' },
      rank: { minimum: 1, type: 'integer' },
      score: { type: 'number' },
      student: object({ id, name: { type: 'string' } }),
    }),
    type: 'array',
  },
  summary: object({
    averagePercentage: { type: 'number' },
    averageScore: { type: 'number' },
    evaluatedCount: { minimum: 0, type: 'integer' },
    passPercentage: { type: 'number' },
    pendingCount: { minimum: 0, type: 'integer' },
    totalAttempts: { minimum: 0, type: 'integer' },
  }),
})

export const openApiSchemas = {
  ErrorResponse: object({
    error: object(
      {
        code: { type: 'string' },
        details: {
          additionalProperties: true,
          description: 'Validation or diagnostic details. Omitted for production internal errors.',
          type: 'object',
        },
        message: { type: 'string' },
      },
      ['code', 'message'],
    ),
    status: { enum: ['error'], type: 'string' },
  }),
  Pagination: pagination,
  PublicUser: publicUser,
  RegistrationUser: registrationUser,
  ManagedUser: managedUser,
  Subject: subject,
  SubjectSummary: subjectSummary,
  QuestionOption: questionOption,
  Question: question,
  Exam: exam,
  StudentExam: studentExam,
  AttemptSummary: attemptSummary,
  StudentAnswer: studentAnswer,
  StudentAttempt: studentAttempt,
  AttemptEvaluationState: attemptEvaluationState,
  Certificate: certificate,
  Notification: notification,
  ImportSummary: importSummary,
  OverviewReport: overviewReport,
  SubjectReport: subjectReport,
  TeacherReport: teacherReport,
  Role: role,
  QuestionType: questionType,
  DifficultyLevel: difficulty,
  ExamType: examType,
  ExamStatus: examStatus,
  AttemptStatus: attemptStatus,
  AttemptResult: attemptResult,
}
