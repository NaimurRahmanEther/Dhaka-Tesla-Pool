import { Navigate } from 'react-router-dom'

import { Spinner } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import { dashboardPathFor } from '@/routes/dashboardPath'

// Blocks the wrong role from a page and sends them to their own dashboard:
// a PASSENGER typing a driver URL by hand lands on the passenger home, not a
// forbidden page. role is compared against the role the backend put on the
// user object - the one source of truth.
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