import { useState } from 'react'
import { Alert, Badge, Button, Card, Icon, Input, PageHeader } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import userService from '@/services/user.service'

export default function ProfilePage() {
  const { user, reloadUser } = useAuth()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const changed = name.trim() !== user.name || email.trim() !== user.email
  async function handleSave(event) {
    event.preventDefault()
    const next = {}
    if (name.trim().length < 3) next.name = 'Enter at least 3 characters'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await userService.updateMe({ name: name.trim(), email: email.trim() })
      const me = await reloadUser()
      setName(me.name)
      setEmail(me.email)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <PageHeader
        title="A little about you."
        description="Keep your account details up to date."
        eyebrow="YOUR PROFILE"
      />
      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[0.8fr_1.5fr]">
        <Card className="text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-100 text-3xl font-bold text-brand-800">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <h2 className="mt-5 break-words text-xl font-bold text-brand-900">{user.name}</h2>
          <p className="mt-2 break-all text-sm text-slate-500">{user.email}</p>
          <Badge className="mt-4" status={user.role} />
          <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-6 text-slate-500">
            Part of a better way around Dhaka.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-brand-900">Personal details</h2>
          <p className="mt-1 text-sm text-slate-500">Your name is shown on your rides.</p>
          {error && (
            <Alert tone="error" className="mt-5">
              {error}
            </Alert>
          )}
          {success && (
            <Alert tone="success" className="mt-5">
              Your profile is up to date.
            </Alert>
          )}
          <form className="mt-7" noValidate onSubmit={handleSave}>
            <fieldset disabled={saving} className="space-y-6">
              <Input
                id="profile-name"
                label="Full name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSuccess(false)
                }}
                error={errors.name}
                required
              />
              <Input
                id="profile-email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSuccess(false)
                }}
                error={errors.email}
                required
              />
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                <Button type="submit" loading={saving} disabled={!changed}>
                  <Icon name="check" />
                  Save changes
                </Button>
                <Button
                  variant="secondary"
                  disabled={!changed}
                  onClick={() => {
                    setName(user.name)
                    setEmail(user.email)
                    setErrors({})
                    setError(null)
                  }}
                >
                  Discard changes
                </Button>
              </div>
            </fieldset>
          </form>
        </Card>
      </div>
    </>
  )
}
