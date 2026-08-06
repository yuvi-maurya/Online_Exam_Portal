import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openApiSpecification } from '../src/docs/openapi.js'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const serverDirectory = path.resolve(scriptDirectory, '..')
const methodPattern = /\b\w+Router\.(delete|get|patch|post|put)\(\s*['"]([^'"]+)['"]/g
const routeFiles = [
  { file: 'authRoutes.js', prefix: '/auth' },
  { file: 'adminRoutes.js', prefix: '/admin' },
  { file: 'teacherRoutes.js', prefix: '/teacher' },
  { file: 'studentRoutes.js', prefix: '/student' },
  { file: 'notificationRoutes.js', prefix: '/notifications' },
  { file: 'certificateRoutes.js', prefix: '/certificates' },
  { file: 'healthRoutes.js', prefix: '/health' },
]

const publicOperations = new Set([
  'POST /auth/register',
  'POST /auth/verify-email',
  'POST /auth/resend-otp',
  'POST /auth/login',
  'POST /auth/forgot-password',
  'POST /auth/reset-password',
  'GET /certificates/verify/{certificateCode}',
  'GET /health',
])

const bodylessMutationOperations = new Set([
  'PATCH /admin/students/{id}/deactivate',
  'PATCH /admin/students/{id}/activate',
  'PATCH /admin/teachers/{id}/deactivate',
  'PATCH /admin/teachers/{id}/activate',
  'PATCH /teacher/exams/{id}/publish',
  'PATCH /teacher/exams/{id}/archive',
  'POST /student/exams/{id}/start',
  'POST /student/attempts/{id}/submit',
  'PATCH /notifications/read-all',
  'PATCH /notifications/{id}/read',
])

function normalizeExpressPath(prefix, routePath) {
  const joined = routePath === '/' ? prefix : `${prefix}${routePath}`
  return joined.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

async function readExpressOperations() {
  const operations = new Set()

  for (const { file, prefix } of routeFiles) {
    const source = await readFile(path.join(serverDirectory, 'src', 'routes', file), 'utf8')

    for (const match of source.matchAll(methodPattern)) {
      const [, method, routePath] = match
      operations.add(`${method.toUpperCase()} ${normalizeExpressPath(prefix, routePath)}`)
    }
  }

  return operations
}

function readDocumentedOperations() {
  const operations = new Set()
  const operationIds = new Set()
  const duplicateOperationIds = new Set()

  for (const [routePath, pathItem] of Object.entries(openApiSpecification.paths)) {
    for (const method of ['delete', 'get', 'patch', 'post', 'put']) {
      const operation = pathItem[method]

      if (!operation) continue

      operations.add(`${method.toUpperCase()} ${routePath}`)

      if (operationIds.has(operation.operationId)) {
        duplicateOperationIds.add(operation.operationId)
      }

      operationIds.add(operation.operationId)
    }
  }

  return { duplicateOperationIds, operations }
}

function difference(left, right) {
  return [...left].filter((value) => !right.has(value)).sort()
}

function collectMissingSchemaReferences(value, missing = new Set()) {
  if (!value || typeof value !== 'object') return missing

  if (typeof value.$ref === 'string' && value.$ref.startsWith('#/components/schemas/')) {
    const schemaName = value.$ref.slice('#/components/schemas/'.length)

    if (!Object.hasOwn(openApiSpecification.components.schemas, schemaName)) {
      missing.add(value.$ref)
    }
  }

  for (const child of Object.values(value)) {
    collectMissingSchemaReferences(child, missing)
  }

  return missing
}

function findMissingPathParameters() {
  const missing = []

  for (const [routePath, pathItem] of Object.entries(openApiSpecification.paths)) {
    const expectedNames = [...routePath.matchAll(/\{([^}]+)\}/g)].map((match) => match[1])

    for (const method of ['delete', 'get', 'patch', 'post', 'put']) {
      const operation = pathItem[method]

      if (!operation) continue

      const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]
      const documentedNames = new Set(
        parameters
          .filter((parameter) => parameter.in === 'path' && parameter.required === true)
          .map((parameter) => parameter.name),
      )

      for (const name of expectedNames) {
        if (!documentedNames.has(name))
          missing.push(`${method.toUpperCase()} ${routePath}: ${name}`)
      }
    }
  }

  return missing
}

function findOperationContractGaps() {
  const gaps = []

  for (const [routePath, pathItem] of Object.entries(openApiSpecification.paths)) {
    for (const method of ['delete', 'get', 'patch', 'post', 'put']) {
      const operation = pathItem[method]

      if (!operation) continue

      const operationKey = `${method.toUpperCase()} ${routePath}`
      const isPublic = publicOperations.has(operationKey)
      const hasBearerSecurity = operation.security?.some((requirement) =>
        Object.hasOwn(requirement, 'bearerAuth'),
      )

      if (!operation.operationId) gaps.push(`${operationKey}: operationId`)
      if (!operation.summary) gaps.push(`${operationKey}: summary`)
      if (!operation.description) gaps.push(`${operationKey}: description`)
      if (!operation.tags?.length) gaps.push(`${operationKey}: tags`)
      if (isPublic && hasBearerSecurity) gaps.push(`${operationKey}: unexpectedly requires auth`)
      if (!isPublic && !hasBearerSecurity) gaps.push(`${operationKey}: bearer auth requirement`)

      const successResponses = Object.entries(operation.responses ?? {}).filter(([status]) =>
        /^2\d\d$/.test(status),
      )

      if (!successResponses.length) {
        gaps.push(`${operationKey}: success response`)
      }

      for (const [status, response] of successResponses) {
        const mediaTypes = Object.values(response.content ?? {})

        if (!mediaTypes.length || mediaTypes.some((mediaType) => !mediaType.schema)) {
          gaps.push(`${operationKey}: ${status} response schema`)
        }
      }

      const requiresBody = ['patch', 'post', 'put'].includes(method)
      if (requiresBody && !bodylessMutationOperations.has(operationKey) && !operation.requestBody) {
        gaps.push(`${operationKey}: request body`)
      }

      if (operation.requestBody) {
        const mediaTypes = Object.values(operation.requestBody.content ?? {})

        if (!mediaTypes.length || mediaTypes.some((mediaType) => !mediaType.schema)) {
          gaps.push(`${operationKey}: request body schema`)
        }
      }
    }
  }

  return gaps
}

const expressOperations = await readExpressOperations()
const documented = readDocumentedOperations()
const missing = difference(expressOperations, documented.operations)
const extra = difference(documented.operations, expressOperations)
const missingSchemaReferences = collectMissingSchemaReferences(openApiSpecification)
const missingPathParameters = findMissingPathParameters()
const operationContractGaps = findOperationContractGaps()

if (
  missing.length ||
  extra.length ||
  documented.duplicateOperationIds.size ||
  missingSchemaReferences.size ||
  missingPathParameters.length ||
  operationContractGaps.length
) {
  if (missing.length) console.error(`Missing OpenAPI operations:\n${missing.join('\n')}`)
  if (extra.length)
    console.error(`OpenAPI operations without an Express route:\n${extra.join('\n')}`)
  if (documented.duplicateOperationIds.size) {
    console.error(
      `Duplicate operationId values:\n${[...documented.duplicateOperationIds].sort().join('\n')}`,
    )
  }
  if (missingSchemaReferences.size) {
    console.error(`Unknown schema references:\n${[...missingSchemaReferences].sort().join('\n')}`)
  }
  if (missingPathParameters.length) {
    console.error(`Undocumented required path parameters:\n${missingPathParameters.join('\n')}`)
  }
  if (operationContractGaps.length) {
    console.error(`Incomplete OpenAPI operation contracts:\n${operationContractGaps.join('\n')}`)
  }

  process.exitCode = 1
} else {
  console.log(`OpenAPI coverage complete: ${expressOperations.size} Express routes documented.`)
}
