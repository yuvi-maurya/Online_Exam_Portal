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

const managedUserWrite = {
  additionalProperties: false,
  properties: {
    email: { format: 'email', maxLength: 254, type: 'string' },
    name: { maxLength: 100, minLength: 2, type: 'string' },
  },
  required: ['email', 'name'],
  type: 'object',
}

const managedUserPatch = {
  ...managedUserWrite,
  minProperties: 1,
  required: [],
}

const subjectWrite = {
  additionalProperties: false,
  properties: {
    code: {
      description: 'Normalized to uppercase by the API.',
      maxLength: 30,
      minLength: 2,
      pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$',
      type: 'string',
    },
    description: { maxLength: 2000, nullable: true, type: 'string' },
    name: { maxLength: 100, minLength: 2, type: 'string' },
  },
  required: ['code', 'name'],
  type: 'object',
}

const subjectPatch = { ...subjectWrite, minProperties: 1, required: [] }

const adminOperation = (operation) => secured(operation, 'ADMIN')

const managedUserResponse = (resourceKey, description) =>
  jsonResponse(
    description,
    successSchema(dataObject({ [resourceKey]: ref('ManagedUser') }), { message: true }),
  )

const managedUserListPath = (plural, singular) => ({
  get: adminOperation({
    description: `Returns ${plural} ordered newest first with optional case-insensitive name/email search.`,
    operationId: `listAdmin${plural[0].toUpperCase()}${plural.slice(1)}`,
    parameters: [
      ...paginationParameters,
      {
        description: 'Case-insensitive name or email search (maximum 100 characters).',
        in: 'query',
        name: 'search',
        schema: { maxLength: 100, type: 'string' },
      },
    ],
    responses: {
      200: jsonResponse(
        `${plural} returned.`,
        successSchema(
          dataObject({
            [plural]: { items: ref('ManagedUser'), type: 'array' },
            pagination: ref('Pagination'),
          }),
        ),
      ),
      400: standardErrors[400],
      401: standardErrors[401],
      403: standardErrors[403],
      429: standardErrors[429],
      500: standardErrors[500],
    },
    summary: `List ${plural}`,
    tags: ['Admin users'],
  }),
  post: adminOperation({
    description: `Creates a verified ${singular} with an unusable random password and sends password-setup instructions.`,
    operationId: `createAdmin${singular[0].toUpperCase()}${singular.slice(1)}`,
    requestBody: jsonBody(managedUserWrite),
    responses: {
      201: managedUserResponse(singular, `${singular} created.`),
      400: standardErrors[400],
      401: standardErrors[401],
      403: standardErrors[403],
      409: standardErrors[409],
      429: standardErrors[429],
      500: standardErrors[500],
      503: standardErrors[503],
    },
    summary: `Create a ${singular}`,
    tags: ['Admin users'],
  }),
})

const managedUserDetailPath = (singular) => ({
  get: adminOperation({
    operationId: `getAdmin${singular[0].toUpperCase()}${singular.slice(1)}`,
    parameters: [pathParameter('id', `${singular} user identifier`)],
    responses: {
      200: jsonResponse(
        `${singular} returned.`,
        successSchema(dataObject({ [singular]: ref('ManagedUser') })),
      ),
      400: standardErrors[400],
      401: standardErrors[401],
      403: standardErrors[403],
      404: standardErrors[404],
      429: standardErrors[429],
      500: standardErrors[500],
    },
    summary: `Get a ${singular}`,
    tags: ['Admin users'],
  }),
  patch: adminOperation({
    description:
      'Updates only the name and/or email; role and account state cannot be changed here.',
    operationId: `updateAdmin${singular[0].toUpperCase()}${singular.slice(1)}`,
    parameters: [pathParameter('id', `${singular} user identifier`)],
    requestBody: jsonBody(managedUserPatch),
    responses: {
      200: managedUserResponse(singular, `${singular} updated.`),
      400: standardErrors[400],
      401: standardErrors[401],
      403: standardErrors[403],
      404: standardErrors[404],
      409: standardErrors[409],
      429: standardErrors[429],
      500: standardErrors[500],
    },
    summary: `Update a ${singular}`,
    tags: ['Admin users'],
  }),
})

const managedUserStatePath = (singular, active) => ({
  patch: adminOperation({
    description: `${active ? 'Reactivates' : 'Deactivates'} the account without deleting its history.`,
    operationId: `${active ? 'activate' : 'deactivate'}Admin${singular[0].toUpperCase()}${singular.slice(1)}`,
    parameters: [pathParameter('id', `${singular} user identifier`)],
    responses: {
      200: managedUserResponse(singular, `${singular} ${active ? 'activated' : 'deactivated'}.`),
      400: standardErrors[400],
      401: standardErrors[401],
      403: standardErrors[403],
      404: standardErrors[404],
      429: standardErrors[429],
      500: standardErrors[500],
    },
    summary: `${active ? 'Activate' : 'Deactivate'} a ${singular}`,
    tags: ['Admin users'],
  }),
})

export const adminPaths = {
  '/admin/audit-logs': {
    get: adminOperation({
      description:
        'Returns sensitive-action audit entries newest first, filterable by actor and action.',
      operationId: 'listAdminAuditLogs',
      parameters: [
        ...paginationParameters,
        {
          description: 'Exact actor user identifier.',
          in: 'query',
          name: 'actorId',
          schema: { maxLength: 100, minLength: 1, type: 'string' },
        },
        {
          description: 'Uppercase audit action, such as USER_DEACTIVATED.',
          in: 'query',
          name: 'action',
          schema: { pattern: '^[A-Z][A-Z0-9_]{1,99}$', type: 'string' },
        },
      ],
      responses: {
        200: jsonResponse(
          'Audit entries returned.',
          successSchema(
            dataObject({
              auditLogs: {
                items: dataObject({
                  action: { type: 'string' },
                  actor: dataObject({
                    id: { type: 'string' },
                    name: { type: 'string' },
                    role: ref('Role'),
                  }),
                  actorId: { type: 'string' },
                  createdAt: { format: 'date-time', type: 'string' },
                  entityId: { type: 'string' },
                  entityType: { type: 'string' },
                  id: { type: 'string' },
                  metadata: { additionalProperties: true, nullable: true, type: 'object' },
                }),
                type: 'array',
              },
              pagination: ref('Pagination'),
            }),
          ),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'List audit logs',
      tags: ['Admin audit'],
    }),
  },
  '/admin/dashboard': {
    get: adminOperation({
      operationId: 'getAdminDashboard',
      responses: {
        200: jsonResponse(
          'Dashboard counts returned.',
          successSchema(
            dataObject({
              totalExams: { minimum: 0, type: 'integer' },
              totalStudents: { minimum: 0, type: 'integer' },
              totalSubjects: { minimum: 0, type: 'integer' },
              totalTeachers: { minimum: 0, type: 'integer' },
            }),
          ),
        ),
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Get dashboard counts',
      tags: ['Admin reports'],
    }),
  },
  '/admin/reports/overview': {
    get: adminOperation({
      description: 'Aggregates evaluated attempts only. CSV and JSON contain the same metrics.',
      operationId: 'getAdminOverviewReport',
      parameters: [reportFormatParameter],
      responses: {
        200: csvOrJsonResponse('Overview report returned.', successSchema(ref('OverviewReport'))),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
        503: standardErrors[503],
      },
      summary: 'Get the admin overview report',
      tags: ['Admin reports'],
    }),
  },
  '/admin/reports/subject-wise': {
    get: adminOperation({
      description: 'Returns one row per subject using evaluated attempts only.',
      operationId: 'getAdminSubjectWiseReport',
      parameters: [reportFormatParameter],
      responses: {
        200: csvOrJsonResponse(
          'Subject-wise report returned.',
          successSchema(dataObject({ subjects: { items: ref('SubjectReport'), type: 'array' } })),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
        503: standardErrors[503],
      },
      summary: 'Get the subject-wise report',
      tags: ['Admin reports'],
    }),
  },
  '/admin/reports/top-performers': {
    get: adminOperation({
      description: 'Ranks students with at least one evaluated attempt by average percentage.',
      operationId: 'getAdminTopPerformers',
      responses: {
        200: jsonResponse(
          'Leaderboard returned.',
          successSchema(
            dataObject({
              topPerformers: {
                items: dataObject({
                  attemptCount: { minimum: 1, type: 'integer' },
                  averagePercentage: { type: 'number' },
                  rank: { minimum: 1, type: 'integer' },
                  student: dataObject({ id: { type: 'string' }, name: { type: 'string' } }),
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
        503: standardErrors[503],
      },
      summary: 'Get the student leaderboard',
      tags: ['Admin reports'],
    }),
  },
  '/admin/students': managedUserListPath('students', 'student'),
  '/admin/students/bulk-import': {
    post: adminOperation({
      description:
        'Parses the entire file before creating rows. Required headers: name, email. Up to 1,000 data rows and 5 MB. Invalid rows are reported without failing valid rows.',
      operationId: 'bulkImportStudents',
      requestBody: multipartFileBody('CSV or XLSX student import file.'),
      responses: {
        200: jsonResponse(
          'Import processed.',
          successSchema(dataObject({ summary: ref('ImportSummary') }), { message: true }),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Bulk import students',
      tags: ['Admin users'],
    }),
  },
  '/admin/students/{id}': managedUserDetailPath('student'),
  '/admin/students/{id}/deactivate': managedUserStatePath('student', false),
  '/admin/students/{id}/activate': managedUserStatePath('student', true),
  '/admin/teachers': managedUserListPath('teachers', 'teacher'),
  '/admin/teachers/{id}': managedUserDetailPath('teacher'),
  '/admin/teachers/{id}/deactivate': managedUserStatePath('teacher', false),
  '/admin/teachers/{id}/activate': managedUserStatePath('teacher', true),
  '/admin/subjects': {
    get: adminOperation({
      operationId: 'listAdminSubjects',
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
      tags: ['Admin subjects'],
    }),
    post: adminOperation({
      operationId: 'createSubject',
      requestBody: jsonBody(subjectWrite),
      responses: {
        201: jsonResponse(
          'Subject created.',
          successSchema(dataObject({ subject: ref('Subject') }), { message: true }),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        409: standardErrors[409],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Create a subject',
      tags: ['Admin subjects'],
    }),
  },
  '/admin/subjects/{id}': {
    delete: adminOperation({
      description: 'Fails with 409 when questions or exams depend on the subject.',
      operationId: 'deleteSubject',
      parameters: [pathParameter('id', 'Subject identifier')],
      responses: {
        200: jsonResponse(
          'Subject deleted.',
          successSchema(dataObject({ subject: ref('Subject') }), { message: true }),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        404: standardErrors[404],
        409: standardErrors[409],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Delete a subject',
      tags: ['Admin subjects'],
    }),
    get: adminOperation({
      operationId: 'getAdminSubject',
      parameters: [pathParameter('id', 'Subject identifier')],
      responses: {
        200: jsonResponse(
          'Subject returned.',
          successSchema(dataObject({ subject: ref('Subject') })),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        404: standardErrors[404],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Get a subject',
      tags: ['Admin subjects'],
    }),
    patch: adminOperation({
      operationId: 'updateSubject',
      parameters: [pathParameter('id', 'Subject identifier')],
      requestBody: jsonBody(subjectPatch),
      responses: {
        200: jsonResponse(
          'Subject updated.',
          successSchema(dataObject({ subject: ref('Subject') }), { message: true }),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        404: standardErrors[404],
        409: standardErrors[409],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Update a subject',
      tags: ['Admin subjects'],
    }),
  },
}
