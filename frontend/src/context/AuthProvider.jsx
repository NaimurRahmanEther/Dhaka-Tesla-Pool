import { useEffect, useState } from 'react'

import { AuthContext } from '@/context/auth.context'
import authService from '@/services/auth.service'
import userService from '@/services/user.service'

// Holds the signed-in user and the auth actions, and restores the session from
// the server on load.
//
// The access token lives in localStorage; the refresh token is an httpOnly
// cookie this app never sees. On every change of the token - first load, login,
// logout - this provider asks GET /users/me who the token belongs to, so the
// user object always comes from the server rather than from anything stored
// client-side.
export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'))
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    async function restore() {
      if (!token) {
        setUser(null)
        setChecking(false)
        return
      }

      try {
        const me = await userService.getMe()
        if (active) setUser(me)
      } catch {
        // The token is bad beyond repair (refresh failed too). Clear it.
        localStorage.removeItem('accessToken')
        if (active) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (active) setChecking(false)
      }
    }

    restore()

    return () => {
      active = false
    }
  }, [token])

  async function login(email, password) {
    const { accessToken } = await authService.login(email, password)
    localStorage.setItem('accessToken', accessToken)
    setToken(accessToken) // the effect above now fetches /users/me
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // The refresh cookie may already be dead. Local state must still clear.
    }
    localStorage.removeItem('accessToken')
    setToken(null)
    setUser(null)
  }

  // Register creates the account only - the backend returns no token for it, so
  // the caller must send the user to the login page afterwards.
  const register = (payload) => authService.register(payload)

  return (
    <AuthContext.Provider value={{ user, token, checking, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}