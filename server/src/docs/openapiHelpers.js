const errorResponse = (description) => ({
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
  description,
})

export const standardErrors = Object.freeze({
  400: errorResponse('The request failed validation.'),
  401: errorResponse('A valid bearer token is required.'),
  403: errorResponse('The authenticated user is not allowed to perform this action.'),
  404: errorResponse('The requested resource was not found.'),
  409: errorResponse('The request conflicts with the current resource state.'),
  429: errorResponse('The request was rate limited.'),
  500: errorResponse('An unexpected server error occurred.'),
  503: errorResponse('The operation could not complete because a dependency was unavailable.'),
})

export const jsonBody = (schema) => ({
  content: { 'application/json': { schema } },
  required: true,
})

export const multipartFileBody = (description) => ({
  content: {
    'multipart/form-data': {
      schema: {
        additionalProperties: false,
        properties: {
          file: {
            description,
            format: 'binary',
            type: 'string',
          },
        },
        required: ['file'],
        type: 'object',
      },
    },
  },
  required: true,
})

export const jsonResponse = (description, schema) => ({
  content: { 'application/json': { schema } },
  description,
})

export const csvOrJsonResponse = (description, schema) => ({
  content: {
    'application/json': { schema },
    'text/csv': {
      schema: {
        description:
          'UTF-8 CSV document (including a byte-order mark for spreadsheet compatibility).',
        type: 'string',
      },
    },
  },
  description,
})

export const successSchema = (dataSchema, { message = false } = {}) => ({
  additionalProperties: false,
  properties: {
    status: { enum: ['success'], type: 'string' },
    ...(message ? { message: { type: 'string' } } : {}),
    ...(dataSchema ? { data: dataSchema } : {}),
  },
  required: ['status', ...(message ? ['message'] : []), ...(dataSchema ? ['data'] : [])],
  type: 'object',
})

export const dataObject = (properties, required = Object.keys(properties)) => ({
  additionalProperties: false,
  properties,
  required,
  type: 'object',
})

export const ref = (name) => ({ $ref: `#/components/schemas/${name}` })

export const secured = (operation, role = 'Any authenticated role') => ({
  ...operation,
  description: `${operation.description ? `${operation.description}\n\n` : ''}Required role: ${role}.`,
  security: [{ bearerAuth: [] }],
  'x-required-role': role,
})

export const pathParameter = (name, description = `${name} identifier`) => ({
  description,
  in: 'path',
  name,
  required: true,
  schema: { maxLength: 100, minLength: 1, type: 'string' },
})

export const paginationParameters = [
  {
    description: 'One-based page number.',
    in: 'query',
    name: 'page',
    schema: { default: 1, maximum: 100000, minimum: 1, type: 'integer' },
  },
  {
    description: 'Maximum records per page.',
    in: 'query',
    name: 'limit',
    schema: { default: 20, maximum: 100, minimum: 1, type: 'integer' },
  },
]

export const reportFormatParameter = {
  description: 'Return JSON by default, or download the same report as CSV.',
  in: 'query',
  name: 'format',
  schema: { default: 'json', enum: ['json', 'csv'], type: 'string' },
}
