import { Navigate } from 'react-router-dom'

import { Loading } from '@/components/ui'
import useAuth from '@/hooks/useAuth'

// Requires a signed-in user. The two branches matter:
//   - checking: the session is still being restored on a hard refresh (the
//     access token is in memory and /users/me has not answered yet). A guard
//     that checks `user` without checking `checking` first would bounce a
//     signed-in user back to /login on every refresh.
//   - no user: send them to /login.
export default function ProtectedRoute({ children }) {
  const { checking, user } = useAuth()

  if (checking) {
    return <Loading fullScreen size="lg" label="Checking your session?" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
