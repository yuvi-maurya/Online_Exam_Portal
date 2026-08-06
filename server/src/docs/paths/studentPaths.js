import {
  dataObject,
  jsonBody,
  jsonResponse,
  pathParameter,
  ref,
  secured,
  standardErrors,
  successSchema,
} from '../openapiHelpers.js'

const studentOperation = (operation) => secured(operation, 'STUDENT')
const nullableRef = (name) => ({ allOf: [ref(name)], nullable: true })

const studentErrors = {
  400: standardErrors[400],
  401: standardErrors[401],
  403: standardErrors[403],
  404: standardErrors[404],
  409: standardErrors[409],
  429: standardErrors[429],
  500: standardErrors[500],
  503: standardErrors[503],
}

const attemptResponse = (description, message = false) =>
  jsonResponse(
    description,
    successSchema(dataObject({ attempt: ref('StudentAttempt') }), { message }),
  )

const certificateResponse = (description) =>
  jsonResponse(description, successSchema(dataObject({ certificate: ref('Certificate') })))

const resultOption = dataObject({ id: { type: 'string' }, text: { type: 'string' } })

export const studentPaths = {
  '/student/certificates': {
    get: studentOperation({
      description: 'Returns only certificates issued to the authenticated student, newest first.',
      operationId: 'listStudentCertificates',
      responses: {
        200: jsonResponse(
          'Certificates returned.',
          successSchema(dataObject({ certificates: { items: ref('Certificate'), type: 'array' } })),
        ),
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'List earned certificates',
      tags: ['Student certificates'],
    }),
  },
  '/student/certificates/{id}': {
    get: studentOperation({
      description: 'Ownership is checked before returning the certificate and download URL.',
      operationId: 'getStudentCertificate',
      parameters: [pathParameter('id', 'Certificate identifier')],
      responses: {
        200: certificateResponse('Certificate returned.'),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        404: standardErrors[404],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Get an earned certificate',
      tags: ['Student certificates'],
    }),
  },
  '/student/exams/history': {
    get: studentOperation({
      description: 'Returns the student’s submitted, auto-submitted, and evaluated attempts.',
      operationId: 'listStudentExamHistory',
      responses: {
        200: jsonResponse(
          'Exam history returned.',
          successSchema(
            dataObject({
              attempts: {
                items: dataObject({
                  createdAt: { format: 'date-time', type: 'string' },
                  evaluatedAt: { format: 'date-time', nullable: true, type: 'string' },
                  exam: ref('StudentExam'),
                  id: { type: 'string' },
                  percentage: { nullable: true, type: 'number' },
                  rank: { nullable: true, type: 'integer' },
                  result: ref('AttemptResult'),
                  score: { nullable: true, type: 'number' },
                  startedAt: { format: 'date-time', type: 'string' },
                  status: ref('AttemptStatus'),
                  submittedAt: { format: 'date-time', nullable: true, type: 'string' },
                  timeTakenSeconds: { nullable: true, type: 'integer' },
                }),
                type: 'array',
              },
            }),
          ),
        ),
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'List exam history',
      tags: ['Student exams'],
    }),
  },
  '/student/exams': {
    get: studentOperation({
      description:
        'Lists currently available published exams and the authenticated student’s one-attempt state. No answer keys or correctness fields are returned.',
      operationId: 'listAvailableStudentExams',
      responses: {
        200: jsonResponse(
          'Available exams returned.',
          successSchema(
            dataObject({
              exams: {
                items: {
                  allOf: [
                    ref('StudentExam'),
                    dataObject({
                      attempt: nullableRef('AttemptSummary'),
                      attemptStatus: {
                        enum: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED'],
                        type: 'string',
                      },
                      questionCount: { minimum: 0, type: 'integer' },
                    }),
                  ],
                },
                type: 'array',
              },
            }),
          ),
        ),
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'List available exams',
      tags: ['Student exams'],
    }),
  },
  '/student/exams/{id}/start': {
    post: studentOperation({
      description:
        'Starts the student’s single allowed attempt or returns the existing in-progress attempt. The response intentionally excludes answer keys and correctness.',
      operationId: 'startStudentExam',
      parameters: [pathParameter('id', 'Exam identifier')],
      responses: {
        200: attemptResponse('Existing in-progress attempt returned.', true),
        201: attemptResponse('New attempt created.', true),
        ...studentErrors,
      },
      summary: 'Start or resume an exam',
      tags: ['Student exams'],
    }),
  },
  '/student/attempts/{id}': {
    get: studentOperation({
      description:
        'Returns an owned active attempt with saved answers and persisted question/option order. It never returns correctness or answer keys.',
      operationId: 'getStudentAttempt',
      parameters: [pathParameter('id', 'Attempt identifier')],
      responses: { 200: attemptResponse('Active attempt returned.'), ...studentErrors },
      summary: 'Resume an active attempt',
      tags: ['Student attempts'],
    }),
  },
  '/student/attempts/{id}/answers': {
    patch: studentOperation({
      description:
        'Upserts one answer on an owned IN_PROGRESS attempt. Choice questions require selectedOptionId; open questions require answerText. The response contains no correctness.',
      operationId: 'saveStudentAnswer',
      parameters: [pathParameter('id', 'Attempt identifier')],
      requestBody: jsonBody({
        additionalProperties: false,
        properties: {
          answerText: { maxLength: 100000, minLength: 1, nullable: true, type: 'string' },
          questionId: { maxLength: 100, minLength: 1, type: 'string' },
          selectedOptionId: { maxLength: 100, minLength: 1, nullable: true, type: 'string' },
        },
        required: ['questionId'],
        type: 'object',
      }),
      responses: {
        200: jsonResponse(
          'Answer saved.',
          successSchema(dataObject({ answer: ref('StudentAnswer') }), { message: true }),
        ),
        ...studentErrors,
      },
      summary: 'Save an answer',
      tags: ['Student attempts'],
    }),
  },
  '/student/attempts/{id}/violation': {
    patch: studentOperation({
      description:
        'Records an enabled tab-switch or fullscreen-exit security event. It may auto-submit and evaluate the attempt when the tab-switch limit is exceeded.',
      operationId: 'recordAttemptViolation',
      parameters: [pathParameter('id', 'Attempt identifier')],
      requestBody: jsonBody({
        additionalProperties: false,
        properties: {
          type: { enum: ['TAB_SWITCH', 'FULLSCREEN_EXIT'], type: 'string' },
        },
        required: ['type'],
        type: 'object',
      }),
      responses: {
        200: jsonResponse(
          'Violation recorded.',
          successSchema(
            dataObject({
              violation: dataObject({
                autoFinalized: { type: 'boolean' },
                limitExceeded: { type: 'boolean' },
                remainingTabSwitches: { nullable: true, type: 'integer' },
                status: ref('AttemptStatus'),
                tabSwitchCount: { minimum: 0, type: 'integer' },
                tabSwitchLimit: { minimum: 0, nullable: true, type: 'integer' },
                type: { enum: ['TAB_SWITCH', 'FULLSCREEN_EXIT'], type: 'string' },
              }),
            }),
            { message: true },
          ),
        ),
        ...studentErrors,
      },
      summary: 'Record an exam security violation',
      tags: ['Student attempts'],
    }),
  },
  '/student/attempts/{id}/submit': {
    post: studentOperation({
      description:
        'Submits an owned IN_PROGRESS attempt and runs auto-evaluation. Status is EVALUATED when all answers can be graded, otherwise SUBMITTED pending teacher grading.',
      operationId: 'submitStudentAttempt',
      parameters: [pathParameter('id', 'Attempt identifier')],
      responses: {
        200: jsonResponse(
          'Attempt submitted.',
          successSchema(dataObject({ attempt: ref('AttemptEvaluationState') }), { message: true }),
        ),
        ...studentErrors,
      },
      summary: 'Submit an attempt',
      tags: ['Student attempts'],
    }),
  },
  '/student/attempts/{id}/result': {
    get: studentOperation({
      description:
        'The only student endpoint that reveals correctness and answer keys. Ownership is checked and the attempt must be EVALUATED.',
      operationId: 'getStudentAttemptResult',
      parameters: [pathParameter('id', 'Attempt identifier')],
      responses: {
        200: jsonResponse(
          'Evaluated result returned.',
          successSchema(
            dataObject({
              result: dataObject({
                attemptId: { type: 'string' },
                evaluatedAt: { format: 'date-time', type: 'string' },
                exam: dataObject({ id: { type: 'string' }, title: { type: 'string' } }),
                percentage: { maximum: 100, minimum: 0, type: 'number' },
                questions: {
                  items: dataObject({
                    answerText: { nullable: true, type: 'string' },
                    content: { type: 'string' },
                    correctAnswerText: { nullable: true, type: 'string' },
                    correctOption: { ...resultOption, nullable: true },
                    isCorrect: { type: 'boolean' },
                    marksAwarded: { minimum: 0, type: 'number' },
                    maxMarks: { minimum: 1, type: 'integer' },
                    order: { minimum: 0, type: 'integer' },
                    questionId: { type: 'string' },
                    selectedOption: { ...resultOption, nullable: true },
                    type: ref('QuestionType'),
                  }),
                  type: 'array',
                },
                rank: { minimum: 1, type: 'integer' },
                result: { enum: ['PASS', 'FAIL'], type: 'string' },
                score: { minimum: 0, type: 'number' },
                timeTakenSeconds: { minimum: 0, type: 'integer' },
                totalMarks: { minimum: 1, type: 'integer' },
              }),
            }),
          ),
        ),
        ...studentErrors,
      },
      summary: 'Get an evaluated attempt result',
      tags: ['Student results'],
    }),
  },
}
