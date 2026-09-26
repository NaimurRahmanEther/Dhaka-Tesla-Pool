import { useContext } from 'react'

import { AuthContext } from '@/context/auth.context'

// Reads the auth context. Its own file, not part of AuthContext.jsx, so that
// file only exports a component (see react-refresh/only-export-components).
export default function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}