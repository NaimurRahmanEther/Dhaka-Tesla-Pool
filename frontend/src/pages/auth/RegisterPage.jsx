import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Alert, Button, Card, Input } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import { ROLES } from '@/lib/constants'

const ROLE_OPTIONS = [
  { value: ROLES.PASSENGER, title: 'Passenger', description: 'I request rides and share seats' },
  { value: ROLES.DRIVER, title: 'Driver', description: 'I own a Tesla and drive riders' },
]

// The first real form, and the first real page. It proves the client, the auth
// context, the UI kit and the router all work together: fields go in, the
// backend creates the account, and the user is sent to the login page.
//
// Two things to know about the backend contract:
//   - POST /auth/register returns the created user but NO token. There is no
//     auto-login here; the user must sign in with the new credentials.
//   - The role value must be the exact uppercase strings PASSENGER / DRIVER.
//     They come from lib/constants.js, never typed inline.
//
// Client-side validation mirrors the backend's own messages (zod), so a user
// finds out a password is too short before a round trip. On the server the same
// rules run again anyway, because nobody trusts the browser.
export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [errors, setErrors] = useState({})
  const [backendError, setBackendError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (name.trim().length < 3) nextErrors.name = 'Name must be at least 3 characters'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Invalid email address'
    if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters'
    if (!role) nextErrors.role = 'Choose Passenger or Driver'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setBackendError(null)

    try {
      await register({ name: name.trim(), email: email.trim(), password, role })
      navigate('/login', {
        state: { email: email.trim(), message: 'Account created — log in with your new credentials.' },
      })
    } catch (err) {
      // The backend's message is written to be read by a human (zod validation
      // passes through, "Email already exists", ...), so show it as-is.
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
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Already have one?{' '}
            <Link to="/login" className="font-medium text-sky-700 hover:underline focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:outline-none">
              Log in
            </Link>
          </p>
        </div>

        {backendError && (
          <div className="mt-6">
            <Alert tone="error">{backendError}</Alert>
          </div>
        )}

        <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
          <Input
            id="register-name"
            label="Full name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
          />
          <Input
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <Input
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />

          <fieldset>
            <legend className="block text-sm font-medium text-slate-700">I want to ride or drive</legend>
            <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={role === option.value}
                  onClick={() => setRole(option.value)}
                  className={`rounded-lg border px-4 py-3 text-left transition focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    role === option.value
                      ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                </button>
              ))}
            </div>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
          </fieldset>

          <Button type="submit" full loading={submitting}>
            Create account
          </Button>
        </form>
      </Card>
    </main>
  )
}