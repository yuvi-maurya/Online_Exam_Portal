import { clearStoredSession, getStoredSession } from './authSession.js'
import i18n from '../i18n/index.js'

const DEFAULT_API_URL = 'http://localhost:5000/api'
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor({ code, details, message, status }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.status = status
  }
}

function buildUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function buildHeaders(headers, body, token) {
  const requestHeaders = new Headers(headers)

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  return requestHeaders
}

function serializeBody(body) {
  if (body === undefined || body === null || body instanceof FormData) {
    return body
  }

  return JSON.stringify(body)
}

async function parseResponse(response, responseType) {
  if (response.status === 204) {
    return null
  }

  if (responseType === 'blob') {
    return response.blob()
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : null
}

function redirectToLogin() {
  if (typeof window === 'undefined' || window.location.pathname === '/login') {
    return
  }

  window.location.assign('/login')
}

async function request(path, options = {}) {
  const { body, headers, responseType, ...fetchOptions } = options
  const requestToken = getStoredSession()?.token ?? null
  const response = await fetch(buildUrl(path), {
    ...fetchOptions,
    body: serializeBody(body),
    headers: buildHeaders(headers, body, requestToken),
  })
  const payload = await parseResponse(response, response.ok ? responseType : undefined)

  if (!response.ok) {
    const currentToken = getStoredSession()?.token ?? null

    if (response.status === 401 && currentToken === requestToken) {
      clearStoredSession()
      redirectToLogin()
    }

    throw new ApiError({
      code: payload?.error?.code ?? 'REQUEST_FAILED',
      details: payload?.error?.details,
      message: payload?.error?.message ?? payload?.message ?? i18n.t('errors.requestFailed'),
      status: response.status,
    })
  }

  return payload
}

export const apiClient = {
  delete(path, options) {
    return request(path, { ...options, method: 'DELETE' })
  },
  get(path, options) {
    return request(path, { ...options, method: 'GET' })
  },
  getBlob(path, options = {}) {
    const headers = new Headers(options.headers)
    headers.set('Accept', 'text/csv')

    return request(path, { ...options, headers, method: 'GET', responseType: 'blob' })
  },
  patch(path, body, options) {
    return request(path, { ...options, body, method: 'PATCH' })
  },
  post(path, body, options) {
    return request(path, { ...options, body, method: 'POST' })
  },
  put(path, body, options) {
    return request(path, { ...options, body, method: 'PUT' })
  },
  request,
}

export function getApiErrorMessage(error, fallback = i18n.t('errors.generic')) {
  return error instanceof ApiError && error.message ? error.message : fallback
}
