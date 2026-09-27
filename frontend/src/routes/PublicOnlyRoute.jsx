import { Navigate } from 'react-router-dom'

import { Spinner } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import { dashboardPathFor } from '@/routes/dashboardPath'

// Wraps /login and /register. A signed-in user has no business there: while the
// session is being restored (checking) we show a spinner instead of deciding,
// and once we know, a signed-in user is sent straight to their own dashboard.
// A hard refresh on /login must not flash the form to someone who is signed in.
export default function PublicOnlyRoute({ children }) {
  const { checking, user } = useAuth()

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={dashboardPathFor(user.role)} replace />
  }

  return children
}