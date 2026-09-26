// src/api/client.js
// The only file in the whole app that calls fetch().
//
// Everything else goes through the services in src/services/, which build the
// URLs, and this file handles the HTTP bits once:
//
//   - the base URL from VITE_API_URL,
//   - the Authorization header from the access token in memory (React state),
//   - credentials: "include", so the httpOnly refresh-token cookie is sent,
//   - unwrapping the { success, message, data } response envelope,
//   - turning failures into a plain Error whose message the UI can show,
//   - the 401 -> refresh -> retry-once story for 15-minute access tokens.
//
// The access token is NOT stored in localStorage. It lives only in React state
// (AuthProvider). On app load, AuthProvider calls /auth/refresh-token to get
// a fresh access token using the httpOnly refresh cookie.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// One in-flight refresh shared by all callers. If three requests 401 at the
// same moment, they wait on this single promise instead of each calling
// /auth/refresh-token and racing to store the token.
let refreshing = null

// Access token lives in memory only (React state in AuthProvider).
// We don't use localStorage for access tokens - they're lost on page refresh
// and re-acquired via the httpOnly refresh-token cookie.
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
        // The refresh cookie is dead too: clear the session.
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

  // A single retry after a refresh. Excluded for /auth/login: a wrong password
  // is a real failure, not an expired token.
  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers.Authorization = `Bearer ${accessToken}`
      response = await send()
    }
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      clearAccessToken()
      window.dispatchEvent(new Event('auth:expired'))
    }
    const error = new Error(payload?.message ?? 'Something went wrong')
    error.status = response.status
    throw error
  }

  // The envelope carries the payload under `data`, which is all this app ever
  // needs from a successful response.
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
