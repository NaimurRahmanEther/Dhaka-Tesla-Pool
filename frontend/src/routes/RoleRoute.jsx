import { Navigate } from 'react-router-dom'

import { Spinner } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import { dashboardPathFor } from '@/routes/dashboardPath'

export default function RoleRoute({ role, children }) {
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

  if (user.role !== role) {
    return <Navigate to={dashboardPathFor(user.role)} replace />
  }

  return children
}