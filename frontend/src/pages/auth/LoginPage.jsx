import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { Alert, Button, Icon, Input } from '@/components/ui'
import PasswordInput from '@/components/ui/PasswordInput'
import useAuth from '@/hooks/useAuth'
import { dashboardPathFor } from '@/routes/dashboardPath'

export default function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [backendError, setBackendError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address'
    if (password.length < 6) next.password = 'Use at least 6 characters'
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    setBackendError(null)
    try {
      const me = await login(email.trim(), password)
      navigate(dashboardPathFor(me.role), { replace: true })
    } catch (err) {
      setBackendError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <p className="eyebrow">WELCOME BACK</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-900">
        Your next ride awaits.
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">Log in to pick up where you left off.</p>
      {location.state?.message && (
        <Alert tone="success" className="mt-6">
          {location.state.message}
        </Alert>
      )}
      {backendError && (
        <Alert tone="error" className="mt-6">
          {backendError}
        </Alert>
      )}
      <form className="mt-8" noValidate onSubmit={handleSubmit}>
        <fieldset disabled={submitting} className="space-y-5">
          <Input
            id="login-email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <PasswordInput
            id="login-password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" full loading={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
            {!submitting && <Icon name="arrow" />}
          </Button>
        </fieldset>
      </form>
      <p className="mt-7 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
        New around here?{' '}
        <Link to="/register" className="text-link">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
