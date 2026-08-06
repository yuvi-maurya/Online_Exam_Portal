import {
  dataObject,
  jsonBody,
  jsonResponse,
  ref,
  secured,
  standardErrors,
  successSchema,
} from '../openapiHelpers.js'

const registrationRequest = {
  additionalProperties: false,
  properties: {
    email: { format: 'email', maxLength: 254, type: 'string' },
    name: { maxLength: 100, minLength: 2, type: 'string' },
    password: {
      description:
        'At least eight characters with one letter and one digit; at most 72 UTF-8 bytes.',
      format: 'password',
      minLength: 8,
      type: 'string',
      writeOnly: true,
    },
  },
  required: ['email', 'name', 'password'],
  type: 'object',
}

const emailRequest = {
  additionalProperties: false,
  properties: { email: { format: 'email', maxLength: 254, type: 'string' } },
  required: ['email'],
  type: 'object',
}

const otp = {
  description: 'Six-digit one-time verification code.',
  oneOf: [
    { pattern: '^\\d{6}$', type: 'string' },
    { maximum: 999999, minimum: 100000, type: 'integer' },
  ],
}

const emailOtpRequest = {
  additionalProperties: false,
  properties: { email: emailRequest.properties.email, otp },
  required: ['email', 'otp'],
  type: 'object',
}

const messageResponse = jsonResponse(
  'Request completed successfully.',
  successSchema(null, { message: true }),
)
const userResponse = (description, userSchema = 'RegistrationUser') =>
  jsonResponse(description, successSchema(dataObject({ user: ref(userSchema) }), { message: true }))

export const authPaths = {
  '/auth/register': {
    post: {
      description:
        'Creates an unverified Student account and sends an email-verification OTP. Public registration cannot choose a role.',
      operationId: 'registerStudent',
      requestBody: jsonBody(registrationRequest),
      responses: {
        201: userResponse('Student registered; email verification is pending.'),
        400: standardErrors[400],
        409: standardErrors[409],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Register a student account',
      tags: ['Authentication'],
    },
  },
  '/auth/verify-email': {
    post: {
      description: 'Consumes the current email-verification OTP and marks the account verified.',
      operationId: 'verifyEmail',
      requestBody: jsonBody(emailOtpRequest),
      responses: {
        200: userResponse('Email verified.'),
        400: standardErrors[400],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Verify an email address',
      tags: ['Authentication'],
    },
  },
  '/auth/resend-otp': {
    post: {
      description:
        'Requests a replacement verification OTP. The response is intentionally identical for unknown or ineligible accounts.',
      operationId: 'resendEmailVerificationOtp',
      requestBody: jsonBody(emailRequest),
      responses: {
        200: messageResponse,
        400: standardErrors[400],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Resend an email-verification OTP',
      tags: ['Authentication'],
    },
  },
  '/auth/login': {
    post: {
      description: 'Authenticates an active, email-verified user and returns a bearer JWT.',
      operationId: 'login',
      requestBody: jsonBody({
        additionalProperties: false,
        properties: {
          email: emailRequest.properties.email,
          password: { format: 'password', maxLength: 72, type: 'string', writeOnly: true },
        },
        required: ['email', 'password'],
        type: 'object',
      }),
      responses: {
        200: jsonResponse(
          'Authentication succeeded.',
          successSchema(
            dataObject({
              token: { description: 'JWT used as a Bearer token.', type: 'string' },
              user: ref('PublicUser'),
            }),
          ),
        ),
        400: standardErrors[400],
        401: standardErrors[401],
        403: standardErrors[403],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Log in',
      tags: ['Authentication'],
    },
  },
  '/auth/forgot-password': {
    post: {
      description:
        'Requests a password-reset OTP. The response deliberately does not reveal whether an account exists.',
      operationId: 'forgotPassword',
      requestBody: jsonBody(emailRequest),
      responses: {
        200: messageResponse,
        400: standardErrors[400],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Request a password reset',
      tags: ['Authentication'],
    },
  },
  '/auth/reset-password': {
    post: {
      description: 'Consumes a password-reset OTP and replaces the account password.',
      operationId: 'resetPassword',
      requestBody: jsonBody({
        additionalProperties: false,
        properties: {
          email: emailRequest.properties.email,
          newPassword: {
            description:
              'At least eight characters with one letter and one digit; at most 72 UTF-8 bytes.',
            format: 'password',
            minLength: 8,
            type: 'string',
            writeOnly: true,
          },
          otp,
        },
        required: ['email', 'newPassword', 'otp'],
        type: 'object',
      }),
      responses: {
        200: messageResponse,
        400: standardErrors[400],
        429: standardErrors[429],
        500: standardErrors[500],
      },
      summary: 'Reset a password',
      tags: ['Authentication'],
    },
  },
  '/auth/me': {
    get: secured(
      {
        operationId: 'getCurrentUser',
        responses: {
          200: jsonResponse(
            'Current user returned.',
            successSchema(dataObject({ user: ref('PublicUser') })),
          ),
          401: standardErrors[401],
          429: standardErrors[429],
          500: standardErrors[500],
        },
        summary: 'Get the current user',
        tags: ['Authentication'],
      },
      'ADMIN, TEACHER, or STUDENT',
    ),
  },
  '/auth/admin-check': {
    get: secured(
      {
        operationId: 'checkAdminAccess',
        responses: {
          200: messageResponse,
          401: standardErrors[401],
          403: standardErrors[403],
          429: standardErrors[429],
          500: standardErrors[500],
        },
        summary: 'Confirm administrator access',
        tags: ['Authentication'],
      },
      'ADMIN',
    ),
  },
}
