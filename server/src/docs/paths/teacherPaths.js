import {
  csvOrJsonResponse,
  dataObject,
  jsonBody,
  jsonResponse,
  multipartFileBody,
  paginationParameters,
  pathParameter,
  ref,
  reportFormatParameter,
  secured,
  standardErrors,
  successSchema,
} from '../openapiHelpers.js'

const teacherOperation = (operation) => secured(operation, 'TEACHER')

const optionWrite = {
  additionalProperties: false,
  properties: {
    isCorrect: { type: 'boolean' },
    order: { maximum: 10000, minimum: 0, type: 'integer' },
    text: { maxLength: 2000, minLength: 1, type: 'string' },
  },
  required: ['isCorrect', 'order', 'text'],
  type: 'object',
}

const questionProperties = {
  content: { maxLength: 20000, minLength: 1, type: 'string' },
  correctAnswerText: { maxLength: 20000, minLength: 1, nullable: true, type: 'string' },
  difficulty: ref('DifficultyLevel'),
  marks: { maximum: 1000000, minimum: 1, type: 'integer' },
  options: { items: optionWrite, maxItems: 100, type: 'array' },
  subjectId: { maxLength: 100, minLength: 1, type: 'string' },
  type: ref('QuestionType'),
}

const questionWrite = {
  additionalProperties: false,
  description:
    'MCQ and TRUE_FALSE require options with exactly one correct option and no correctAnswerText. Other types require correctAnswerText and no options.',
  properties: questionProperties,
  required: ['content', 'difficulty', 'marks', 'subjectId', 'type'],
  type: 'object',
}

const questionPatch = { ...questionWrite, minProperties: 1, required: [] }

const examProperties = {
  durationMinutes: { maximum: 1440, minimum: 1, type: 'integer' },
  fullScreenRequired: { default: true, type: 'boolean' },
  passingMarks: { maximum: 1000000, minimum: 0, type: 'integer' },
  shuffleOptions: { default: false, type: 'boolean' },
  shuffleQuestions: { default: false, type: 'boolean' },
  subjectId: { maxLength: 100, minLength: 1, type: 'string' },
  tabSwitchLimit: { maximum: 10000, minimum: 0, nullable: true, type: 'integer' },
  title: { maxLength: 200, minLength: 3, type: 'string' },
  type: ref('ExamType'),
  webcamMonitoring: { default: false, type: 'boolean' },
}

const examWrite = {
  additionalProperties: false,
  properties: examProperties,
  required: ['durationMinutes', 'passingMarks', 'subjectId', 'title', 'type'],
  type: 'object',
}

const examPatch = { ...examWrite, minProperties: 1, required: [] }

const attachment = {
  additionalProperties: false,
  properties: {
    marks: { maximum: 1000000, minimum: 1, type: 'integer' },
    order: { maximum: 1000000, minimum: 0, type: 'integer' },
    questionId: { maxLength: 100, minLength: 1, type: 'string' },
  },
  required: ['marks', 'order', 'questionId'],
  type: 'object',
}

const questionResponse = (description, message = false) =>
  jsonResponse(description, successSchema(dataObject({ question: ref('Question') }), { message }))
const examResponse = (description, message = true) =>
  jsonResponse(description, successSchema(dataObject({ exam: ref('Exam') }), { message }))

const teacherErrors = {
  400: standardErrors[400],
  401: standardErrors[401],
  403: standardErrors[403],
  404: standardErrors[404],
  409: standardErrors[409],
  429: standardErrors[429],
  500: standardErrors[500],
  503: standardErrors[503],
}

export const teacherPaths = {
  '/teacher/subjects': {
    get: teacherOperation({
      description: 'Read-only subject catalogue for teacher question and exam forms.',
      operationId: 'listTeacherSubjects',
      responses: {
        200: jsonResponse(
          'Subjects returned.',
          successSchema(dataObject({ subjects: { items: ref('Subject'), type: 'array' } })),
        ),
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'List subjects',
      tags: ['Teacher questions'],
    }),
  },
  '/teacher/questions': {
    get: teacherOperation({
      description: 'Lists only questions created by the authenticated teacher.',
      operationId: 'listTeacherQuestions',
      parameters: [
        ...paginationParameters,
        {
          in: 'query',
          name: 'subjectId',
          schema: { maxLength: 100, minLength: 1, type: 'string' },
        },
        { in: 'query', name: 'type', schema: ref('QuestionType') },
        { in: 'query', name: 'difficulty', schema: ref('DifficultyLevel') },
      ],
      responses: {
        200: jsonResponse(
          'Questions returned.',
          successSchema(
            dataObject({
              pagination: ref('Pagination'),
              questions: { items: ref('Question'), type: 'array' },
            }),
          ),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'List question-bank questions',
      tags: ['Teacher questions'],
    }),
    post: teacherOperation({
      operationId: 'createTeacherQuestion',
      requestBody: jsonBody(questionWrite),
      responses: {
        201: questionResponse('Question created.', true),
        ...teacherErrors,
      },
      summary: 'Create a question',
      tags: ['Teacher questions'],
    }),
  },
  '/teacher/questions/bulk-import': {
    post: teacherOperation({
      description:
        'Parses the entire file before creating rows. Required headers: type, content, difficulty, marks, plus subjectCode or subjectId. Choice options may use an options JSON column or consecutive option1..option100 columns with correctOption. Up to 1,000 data rows and 5 MB.',
      operationId: 'bulkImportQuestions',
      requestBody: multipartFileBody('CSV or XLSX question import file.'),
      responses: {
        200: jsonResponse(
          'Import processed.',
          successSchema(dataObject({ summary: ref('ImportSummary') }), { message: true }),
        ),
        ...teacherErrors,
      },
      summary: 'Bulk import questions',
      tags: ['Teacher questions'],
    }),
  },
  '/teacher/questions/{id}': {
    delete: teacherOperation({
      description: 'Fails with 409 when an exam or student response depends on the question.',
      operationId: 'deleteTeacherQuestion',
      parameters: [pathParameter('id', 'Question identifier')],
      responses: { 200: questionResponse('Question deleted.', true), ...teacherErrors },
      summary: 'Delete a question',
      tags: ['Teacher questions'],
    }),
    get: teacherOperation({
      description: 'Ownership is checked before returning the question and its answer key.',
      operationId: 'getTeacherQuestion',
      parameters: [pathParameter('id', 'Question identifier')],
      responses: { 200: questionResponse('Question returned.'), ...teacherErrors },
      summary: 'Get a question',
      tags: ['Teacher questions'],
    }),
    patch: teacherOperation({
      description: 'Updates an owned question subject to dependency and draft-exam locks.',
      operationId: 'updateTeacherQuestion',
      parameters: [pathParameter('id', 'Question identifier')],
      requestBody: jsonBody(questionPatch),
      responses: { 200: questionResponse('Question updated.', true), ...teacherErrors },
      summary: 'Update a question',
      tags: ['Teacher questions'],
    }),
  },
  '/teacher/exams': {
    get: teacherOperation({
      description: 'Lists only the authenticated teacher’s exams with question and attempt counts.',
      operationId: 'listTeacherExams',
      responses: {
        200: jsonResponse(
          'Exams returned.',
          successSchema(dataObject({ exams: { items: ref('Exam'), type: 'array' } })),
        ),
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'List exams',
      tags: ['Teacher exams'],
    }),
    post: teacherOperation({
      description: 'Creates an owned DRAFT exam with zero total marks and no schedule.',
      operationId: 'createTeacherExam',
      requestBody: jsonBody(examWrite),
      responses: { 201: examResponse('Exam draft created.'), ...teacherErrors },
      summary: 'Create an exam draft',
      tags: ['Teacher exams'],
    }),
  },
  '/teacher/exams/{id}': {
    delete: teacherOperation({
      description: 'Only an unused DRAFT can be deleted; historical exams must be archived.',
      operationId: 'deleteTeacherExam',
      parameters: [pathParameter('id', 'Exam identifier')],
      responses: { 200: examResponse('Exam deleted.'), ...teacherErrors },
      summary: 'Delete an exam draft',
      tags: ['Teacher exams'],
    }),
    get: teacherOperation({
      description: 'Returns an owned exam including attached questions and answer keys.',
      operationId: 'getTeacherExam',
      parameters: [pathParameter('id', 'Exam identifier')],
      responses: { 200: examResponse('Exam returned.', false), ...teacherErrors },
      summary: 'Get an exam builder detail',
      tags: ['Teacher exams'],
    }),
    patch: teacherOperation({
      description: 'Only DRAFT exams can be edited.',
      operationId: 'updateTeacherExam',
      parameters: [pathParameter('id', 'Exam identifier')],
      requestBody: jsonBody(examPatch),
      responses: { 200: examResponse('Exam updated.'), ...teacherErrors },
      summary: 'Update an exam draft',
      tags: ['Teacher exams'],
    }),
  },
  '/teacher/exams/{id}/questions': {
    post: teacherOperation({
      description:
        'Attaches 1–100 owned questions from the exam subject to a DRAFT exam. Question IDs and order values must each be unique.',
      operationId: 'attachQuestionsToExam',
      parameters: [pathParameter('id', 'Exam identifier')],
      requestBody: jsonBody({
        oneOf: [
          { items: attachment, maxItems: 100, minItems: 1, type: 'array' },
          {
            additionalProperties: false,
            properties: {
              questions: { items: attachment, maxItems: 100, minItems: 1, type: 'array' },
            },
            required: ['questions'],
            type: 'object',
          },
        ],
      }),
      responses: { 200: examResponse('Questions attached.'), ...teacherErrors },
      summary: 'Attach questions to an exam',
      tags: ['Teacher exams'],
    }),
  },
  '/teacher/exams/{id}/questions/{questionId}': {
    delete: teacherOperation({
      description: 'Detaches a question from a DRAFT exam and recomputes total marks.',
      operationId: 'detachQuestionFromExam',
      parameters: [
        pathParameter('id', 'Exam identifier'),
        pathParameter('questionId', 'Question identifier'),
      ],
      responses: { 200: examResponse('Question detached.'), ...teacherErrors },
      summary: 'Detach a question from an exam',
      tags: ['Teacher exams'],
    }),
    patch: teacherOperation({
      description: 'Changes marks and/or order for an attached question on a DRAFT exam.',
      operationId: 'updateExamQuestion',
      parameters: [
        pathParameter('id', 'Exam identifier'),
        pathParameter('questionId', 'Question identifier'),
      ],
      requestBody: jsonBody({
        additionalProperties: false,
        minProperties: 1,
        properties: {
          marks: { maximum: 1000000, minimum: 1, type: 'integer' },
          order: { maximum: 1000000, minimum: 0, type: 'integer' },
        },
        type: 'object',
      }),
      responses: { 200: examResponse('Attached question updated.'), ...teacherErrors },
      summary: 'Update an attached question',
      tags: ['Teacher exams'],
    }),
  },
  '/teacher/exams/{id}/schedule': {
    patch: teacherOperation({
      description: 'Sets a future, timezone-qualified start/end schedule on a DRAFT exam.',
      operationId: 'scheduleTeacherExam',
      parameters: [pathParameter('id', 'Exam identifier')],
      requestBody: jsonBody({
        additionalProperties: false,
        properties: {
          scheduledEnd: { format: 'date-time', type: 'string' },
          scheduledStart: { format: 'date-time', type: 'string' },
        },
        required: ['scheduledEnd', 'scheduledStart'],
        type: 'object',
      }),
      responses: { 200: examResponse('Exam scheduled.'), ...teacherErrors },
      summary: 'Schedule an exam',
      tags: ['Teacher exams'],
    }),
  },
  '/teacher/exams/{id}/publish': {
    patch: teacherOperation({
      description:
        'Publishes a ready DRAFT. It must have questions, positive total marks, passing marks within total marks, and a valid future schedule.',
      operationId: 'publishTeacherExam',
      parameters: [pathParameter('id', 'Exam identifier')],
      responses: { 200: examResponse('Exam published.'), ...teacherErrors },
      summary: 'Publish an exam',
      tags: ['Teacher exams'],
    }),
  },
  '/teacher/exams/{id}/archive': {
    patch: teacherOperation({
      description: 'Archives an owned PUBLISHED exam.',
      operationId: 'archiveTeacherExam',
      parameters: [pathParameter('id', 'Exam identifier')],
      responses: { 200: examResponse('Exam archived.'), ...teacherErrors },
      summary: 'Archive an exam',
      tags: ['Teacher exams'],
    }),
  },
  '/teacher/exams/{id}/pending-grading': {
    get: teacherOperation({
      description:
        'Returns owned-exam attempts with answers still flagged for manual review, including answer context and maximum marks.',
      operationId: 'getPendingGrading',
      parameters: [pathParameter('id', 'Exam identifier')],
      responses: {
        200: jsonResponse(
          'Pending grading returned.',
          successSchema(
            dataObject({
              attempts: {
                items: dataObject({
                  answers: {
                    items: dataObject({
                      answerText: { nullable: true, type: 'string' },
                      correctAnswerText: { nullable: true, type: 'string' },
                      isCorrect: { nullable: true, type: 'boolean' },
                      marksAwarded: { nullable: true, type: 'number' },
                      maxMarks: { minimum: 1, type: 'integer' },
                      needsManualReview: { type: 'boolean' },
                      questionId: { type: 'string' },
                      questionText: { type: 'string' },
                      questionType: ref('QuestionType'),
                      selectedOption: {
                        nullable: true,
                        oneOf: [dataObject({ id: { type: 'string' }, text: { type: 'string' } })],
                      },
                    }),
                    type: 'array',
                  },
                  id: { type: 'string' },
                  status: ref('AttemptStatus'),
                  student: dataObject({
                    email: { format: 'email', type: 'string' },
                    id: { type: 'string' },
                    name: { type: 'string' },
                  }),
                  submittedAt: { format: 'date-time', nullable: true, type: 'string' },
                }),
                type: 'array',
              },
              exam: dataObject({ id: { type: 'string' }, title: { type: 'string' } }),
            }),
          ),
        ),
        ...teacherErrors,
      },
      summary: 'List pending manual grading',
      tags: ['Teacher grading'],
    }),
  },
  '/teacher/exams/{id}/report': {
    get: teacherOperation({
      description:
        'Owner-only report using evaluated attempts only. CSV and JSON represent the same report.',
      operationId: 'getTeacherExamReport',
      parameters: [pathParameter('id', 'Exam identifier'), reportFormatParameter],
      responses: {
        200: csvOrJsonResponse(
          'Exam report returned.',
          successSchema(dataObject({ report: ref('TeacherReport') })),
        ),
        ...teacherErrors,
      },
      summary: 'Get an exam report',
      tags: ['Teacher reports'],
    }),
  },
  '/teacher/attempts/{attemptId}/answers/{questionId}/grade': {
    patch: teacherOperation({
      description:
        'Awards marks to one pending manual-review answer on an owned exam. The API caps marks at the question’s effective maximum and finalizes the attempt when every answer is graded.',
      operationId: 'gradeAttemptAnswer',
      parameters: [
        pathParameter('attemptId', 'Attempt identifier'),
        pathParameter('questionId', 'Question identifier'),
      ],
      requestBody: jsonBody({
        additionalProperties: false,
        properties: { marksAwarded: { minimum: 0, type: 'number' } },
        required: ['marksAwarded'],
        type: 'object',
      }),
      responses: {
        200: jsonResponse(
          'Answer graded.',
          successSchema(
            dataObject({
              answer: dataObject({
                answerText: { nullable: true, type: 'string' },
                isCorrect: { type: 'boolean' },
                marksAwarded: { minimum: 0, type: 'number' },
                needsManualReview: { enum: [false], type: 'boolean' },
                questionId: { type: 'string' },
                selectedOptionId: { nullable: true, type: 'string' },
              }),
              attempt: ref('AttemptEvaluationState'),
              finalized: { type: 'boolean' },
            }),
            { message: true },
          ),
        ),
        ...teacherErrors,
      },
      summary: 'Grade one answer',
      tags: ['Teacher grading'],
    }),
  },
}
