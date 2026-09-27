import { readApiPayload } from './response'

// Shared API client handles tokens, cookies, response parsing, and refresh retries.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Concurrent requests share one refresh request.
let refreshing = null

// Keep access tokens in memory; restore sessions through the HttpOnly refresh cookie.
let accessToken = null

function setAccessToken(token) {
  accessToken = token
}

function clearAccessToken() {
  accessToken = null
}

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = (async () => {
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        clearAccessToken()
        return false
      }

      const payload = await response.json()
      setAccessToken(payload.data.accessToken)
      return true
    })()
  }

  try {
    return await refreshing
  } finally {
    refreshing = null
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = accessToken
  if (token) headers.Authorization = `Bearer ${token}`

  const send = () =>
    fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  let response = await send()

  // Retry once after refresh; auth failures must not trigger refresh loops.
  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers.Authorization = `Bearer ${accessToken}`
      response = await send()
    }
  }

  const payload = await readApiPayload(response)

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      clearAccessToken()
      window.dispatchEvent(new Event('auth:expired'))
    }
    const error = new Error(payload?.message ?? 'Something went wrong')
    error.status = response.status
    throw error
  }

  return payload?.data
}

export function getAccessToken() {
  return accessToken
}

export function setAccessTokenExported(token) {
  setAccessToken(token)
}

export default {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
}
