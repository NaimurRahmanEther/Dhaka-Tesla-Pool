import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Alert, Button, Card, Input } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import { dashboardPathFor } from '@/routes/dashboardPath'

// The second real form. Where RegisterPage ends, this page begins: it reads the
// email RegisterPage passed through router state, pre-fills the field, and shows
// the "account created" banner.
//
// Flow after submit:
//   1. login() stores the access token and the provider's effect fetches
//      /users/me - so `user` is still null right after `await login(...)`.
//   2. When /users/me resolves and `user` arrives, the effect below redirects
//      by role. Nothing about roles exists in localStorage, so we wait for the
//      server's answer instead of guessing.
//
// Client-side validation mirrors the backend's zod messages (same schema is
// reused for login): "Invalid email address" and "Password must be at least 6
// characters". A wrong password surfaces the backend's own "Invalid email or
// password".
export default function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, user } = useAuth()

  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [backendError, setBackendError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  // The redirect lands once the server has told us who the user is. replace
  // keeps /login out of the back button.
  useEffect(() => {
    if (loggedIn && user) {
      navigate(dashboardPathFor(user.role), { replace: true })
    }
  }, [loggedIn, user, navigate])

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Invalid email address'
    if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setBackendError(null)

    try {
      await login(email.trim(), password)
      setLoggedIn(true)
    } catch (err) {
      // The backend's message is written to be read by a human, so show it
      // as-is ("Invalid email or password").
      setBackendError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-sky-700 uppercase">Dhaka Tesla Pool</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Log in</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-medium text-sky-700 hover:underline focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:outline-none">
              Create an account
            </Link>
          </p>
        </div>

        {location.state?.message && (
          <div className="mt-6">
            <Alert tone="success">{location.state.message}</Alert>
          </div>
        )}

        {backendError && (
          <div className="mt-6">
            <Alert tone="error">{backendError}</Alert>
          </div>
        )}

        <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
          <Input
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <Input
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />

          <Button type="submit" full loading={submitting}>
            Log in
          </Button>
        </form>
      </Card>
    </main>
  )
}