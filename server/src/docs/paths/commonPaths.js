import {
  dataObject,
  jsonResponse,
  paginationParameters,
  pathParameter,
  ref,
  secured,
  standardErrors,
  successSchema,
} from '../openapiHelpers.js'

const notificationListSchema = successSchema(
  dataObject({
    notifications: { items: ref('Notification'), type: 'array' },
    pagination: ref('Pagination'),
  }),
)

export const commonPaths = {
  '/health': {
    get: {
      description:
        'Reports process uptime and a live database connectivity probe. A disconnected database is reported in the payload without changing the HTTP 200 health response.',
      operationId: 'getHealth',
      responses: {
        200: jsonResponse(
          'Service health returned.',
          dataObject({
            db: { enum: ['connected', 'disconnected'], type: 'string' },
            dbLatencyMs: { minimum: 0, type: 'number' },
            status: { enum: ['ok'], type: 'string' },
            uptime: { description: 'Process uptime in seconds.', minimum: 0, type: 'number' },
          }),
        ),
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Check API health',
      tags: ['Health'],
    },
  },
  '/certificates/verify/{certificateCode}': {
    get: {
      description:
        'Public authenticity check. Returns only the student name, exam title, issue date, and validity flag.',
      operationId: 'verifyCertificate',
      parameters: [
        {
          description: 'Twenty-character certificate code printed on the PDF.',
          in: 'path',
          name: 'certificateCode',
          required: true,
          schema: { pattern: '^[A-Za-z0-9]{20}$', type: 'string' },
        },
      ],
      responses: {
        200: jsonResponse(
          'Certificate verified.',
          successSchema(
            dataObject({
              examTitle: { type: 'string' },
              issuedAt: { format: 'date-time', type: 'string' },
              studentName: { type: 'string' },
              valid: { enum: [true], type: 'boolean' },
            }),
          ),
        ),
        404: standardErrors[404],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Verify a certificate code',
      tags: ['Certificates'],
    },
  },
  '/notifications': {
    get: secured(
      {
        description: 'Returns only the authenticated user’s notifications, newest first.',
        operationId: 'listNotifications',
        parameters: paginationParameters,
        responses: {
          200: jsonResponse('Notifications returned.', notificationListSchema),
          400: standardErrors[400],
          401: standardErrors[401],
          429: standardErrors[429],
          500: standardErrors[500],
        },
        summary: 'List notifications',
        tags: ['Notifications'],
      },
      'ADMIN, TEACHER, or STUDENT',
    ),
  },
  '/notifications/read-all': {
    patch: secured(
      {
        operationId: 'markAllNotificationsRead',
        responses: {
          200: jsonResponse(
            'Unread notifications marked as read.',
            successSchema(dataObject({ updatedCount: { minimum: 0, type: 'integer' } }), {
              message: true,
            }),
          ),
          401: standardErrors[401],
          429: standardErrors[429],
          500: standardErrors[500],
        },
        summary: 'Mark every notification as read',
        tags: ['Notifications'],
      },
      'ADMIN, TEACHER, or STUDENT',
    ),
  },
  '/notifications/{id}/read': {
    patch: secured(
      {
        description: 'Ownership is checked before the notification is updated.',
        operationId: 'markNotificationRead',
        parameters: [pathParameter('id', 'Notification identifier')],
        responses: {
          200: jsonResponse(
            'Notification marked as read.',
            successSchema(dataObject({ notification: ref('Notification') }), { message: true }),
          ),
          400: standardErrors[400],
          401: standardErrors[401],
          403: standardErrors[403],
          404: standardErrors[404],
          429: standardErrors[429],
          500: standardErrors[500],
        },
        summary: 'Mark one notification as read',
        tags: ['Notifications'],
      },
      'ADMIN, TEACHER, or STUDENT',
    ),
  },
}
