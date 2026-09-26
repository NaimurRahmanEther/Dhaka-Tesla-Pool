// src/api/client.js
// The only file in the whole app that calls fetch().
//
// Everything else goes through the services in src/services/, which build the
// URLs, and this file handles the HTTP bits once:
//
//   - the base URL from VITE_API_URL,
//   - the Authorization header from the stored access token,
//   - credentials: "include", so the httpOnly refresh-token cookie is sent,
//   - unwrapping the { success, message, data } response envelope,
//   - turning failures into a plain Error whose message the UI can show,
//   - the 401 -> refresh -> retry-once story for 15-minute access tokens.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// One in-flight refresh shared by all callers. If three requests 401 at the
// same moment, they wait on this single promise instead of each calling
// /auth/refresh-token and racing to store the token.
let refreshing = null

function getToken() {
  return localStorage.getItem('accessToken')
}

function storeToken(token) {
  if (token) localStorage.setItem('accessToken', token)
  else localStorage.removeItem('accessToken')
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
        storeToken(null)
        return false
      }

      const payload = await response.json()
      storeToken(payload.data.accessToken)
      return true
    })()
  }

  try {
    return await refreshing
  } finally {
    refreshing = null
  }
}

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
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
  if (response.status === 401 && !path.startsWith('/auth/login')) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers.Authorization = `Bearer ${getToken()}`
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
    const error = new Error(payload?.message ?? 'Something went wrong')
    error.status = response.status
    throw error
  }

  // The normal envelope carries the payload under `data`. A `raw` request
  // returns the whole body instead - needed for GET /health, which does not use
  // the envelope.
  return raw ? payload : payload?.data
}

export default {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
}