import { useEffect, useState } from 'react'
import { AuthContext } from '@/context/auth.context'
import authService from '@/services/auth.service'
import userService from '@/services/user.service'
import { setAccessTokenExported } from '@/api/client'

// Access tokens remain in memory. Only the httpOnly refresh cookie restores a session.
export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    const clear = () => {
      setAccessTokenExported(null)
      setToken(null)
      setUser(null)
    }
    window.addEventListener('auth:expired', clear)
    async function restore() {
      try {
        const { accessToken } = await authService.refreshToken()
        if (!active) return
        setAccessTokenExported(accessToken)
        const me = await userService.getMe()
        if (active) {
          setToken(accessToken)
          setUser(me)
        }
      } catch {
        if (active) clear()
      } finally {
        if (active) setChecking(false)
      }
    }
    restore()
    return () => {
      active = false
      window.removeEventListener('auth:expired', clear)
    }
  }, [])

  async function login(email, password) {
    const { accessToken } = await authService.login(email, password)
    setAccessTokenExported(accessToken)
    try {
      const me = await userService.getMe()
      setToken(accessToken)
      setUser(me)
      return me
    } catch (error) {
      setAccessTokenExported(null)
      throw error
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      /* Always clear local state. */
    }
    setAccessTokenExported(null)
    setToken(null)
    setUser(null)
  }
  async function reloadUser() {
    const me = await userService.getMe()
    setUser(me)
    return me
  }
  const register = (payload) => authService.register(payload)
  return (
    <AuthContext.Provider value={{ user, token, checking, login, logout, register, reloadUser }}>
      {children}
    </AuthContext.Provider>
  )
}
