import swaggerJsdoc from 'swagger-jsdoc'
import { openApiSchemas } from './openapiSchemas.js'
import { adminPaths } from './paths/adminPaths.js'
import { authPaths } from './paths/authPaths.js'
import { commonPaths } from './paths/commonPaths.js'
import { studentPaths } from './paths/studentPaths.js'
import { teacherPaths } from './paths/teacherPaths.js'

export const openApiSpecification = swaggerJsdoc({
  apis: [],
  definition: {
    components: {
      schemas: openApiSchemas,
      securitySchemes: {
        bearerAuth: {
          bearerFormat: 'JWT',
          description: 'JWT returned by POST /auth/login.',
          scheme: 'bearer',
          type: 'http',
        },
      },
    },
    info: {
      description:
        'Production API contract for Exam Portal. Success payloads use a `status: success` envelope except the health probe; errors use the shared `status: error` envelope. Role requirements are shown on every protected operation.',
      title: 'Exam Portal API',
      version: '1.0.0',
    },
    openapi: '3.0.3',
    paths: {
      ...authPaths,
      ...adminPaths,
      ...teacherPaths,
      ...studentPaths,
      ...commonPaths,
    },
    servers: [{ description: 'Current Exam Portal server', url: '/api' }],
    tags: [
      {
        description: 'Registration, verification, login, and password recovery.',
        name: 'Authentication',
      },
      { description: 'Administrator audit history.', name: 'Admin audit' },
      { description: 'Administrator counts and analytics.', name: 'Admin reports' },
      { description: 'Administrator Student and Teacher management.', name: 'Admin users' },
      { description: 'Administrator Subject management.', name: 'Admin subjects' },
      { description: 'Teacher-owned question bank.', name: 'Teacher questions' },
      { description: 'Teacher-owned exam builder and lifecycle.', name: 'Teacher exams' },
      { description: 'Teacher manual evaluation workflow.', name: 'Teacher grading' },
      { description: 'Teacher exam analytics.', name: 'Teacher reports' },
      { description: 'Student-visible exams and history.', name: 'Student exams' },
      {
        description: 'Student attempt lifecycle and answer persistence.',
        name: 'Student attempts',
      },
      { description: 'Student evaluated-result detail.', name: 'Student results' },
      { description: 'Student certificate ownership endpoints.', name: 'Student certificates' },
      { description: 'Authenticated in-app notification inbox.', name: 'Notifications' },
      { description: 'Public certificate authenticity lookup.', name: 'Certificates' },
      { description: 'In-process and database health.', name: 'Health' },
    ],
  },
})
