import { Navigate } from 'react-router-dom'

import { Spinner } from '@/components/ui'
import useAuth from '@/hooks/useAuth'

// Wait for session restoration before redirecting to login.
export default function ProtectedRoute({ children }) {
  const { checking, user } = useAuth()

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}