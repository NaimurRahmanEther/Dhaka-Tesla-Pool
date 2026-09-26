import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import { Alert, Button, Icon, Input } from '@/components/ui'
import PasswordInput from '@/components/ui/PasswordInput'
import useAuth from '@/hooks/useAuth'
import { ROLES } from '@/lib/constants'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(
    params.get('role') === ROLES.DRIVER ? ROLES.DRIVER : ROLES.PASSENGER,
  )
  const [errors, setErrors] = useState({})
  const [backendError, setBackendError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (name.trim().length < 3) next.name = 'Enter at least 3 characters'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address'
    if (password.length < 6) next.password = 'Use at least 6 characters'
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    setBackendError(null)
    try {
      await register({ name: name.trim(), email: email.trim(), password, role })
      navigate('/login', {
        state: {
          email: email.trim(),
          message: 'You’re all set! Log in to start your first journey.',
        },
      })
    } catch (err) {
      setBackendError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <AuthLayout>
      <p className="eyebrow">COME ALONG</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-900">
        Make room for better.
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Create your account and find your way around Dhaka.
      </p>
      {backendError && (
        <Alert tone="error" className="mt-5">
          {backendError}
        </Alert>
      )}
      <form className="mt-7" noValidate onSubmit={handleSubmit}>
        <fieldset disabled={submitting} className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              How will you join us?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                [ROLES.PASSENGER, 'Passenger', 'Find a seat', 'users'],
                [ROLES.DRIVER, 'Driver', 'Share your Tesla', 'car'],
              ].map(([value, title, description, icon]) => (
                <label
                  key={value}
                  className={
                    'relative flex cursor-pointer gap-3 rounded-xl border p-4 transition ' +
                    (role === value
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-slate-200 bg-white hover:border-brand-100')
                  }
                >
                  <input
                    className="sr-only peer"
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                  />
                  <span className="absolute inset-0 rounded-xl peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand-600" />
                  <Icon name={icon} className="mt-0.5 text-brand-600" />
                  <span>
                    <span className="block text-sm font-semibold text-brand-900">{title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Input
            id="register-name"
            label="Full name"
            autoComplete="name"
            placeholder="Your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            id="register-email"
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
            id="register-password"
            label="Password"
            autoComplete="new-password"
            placeholder="Create a password"
            hint="At least 6 characters"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" full loading={submitting}>
            {submitting ? 'Creating your account…' : 'Create account'}
            {!submitting && <Icon name="arrow" />}
          </Button>
        </fieldset>
      </form>
      <p className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
        Already part of the ride?{' '}
        <Link to="/login" className="text-link">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
