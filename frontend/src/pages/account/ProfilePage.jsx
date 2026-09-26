import { useState } from 'react'
import { Alert, Button, Card, Input, PageHeader } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import userService from '@/services/user.service'

// Full profile page: view and edit name/email via PATCH /users/me.
export default function ProfilePage() {
  const { user, reloadUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const hasChanges = name !== user?.name || email !== user?.email

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await userService.updateMe({ name, email })
      reloadUser()
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Profile" description="Your account details. Changes take effect immediately." />

      {error && <Alert tone="error" className="mt-6">{error}</Alert>}
      {success && <Alert tone="success" className="mt-6">Profile updated</Alert>}

      <Card className="mt-6">
        <form className="p-6 space-y-4" onSubmit={handleSave}>
          <Input
            id="profile-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            error={error}
          />
          <Input
            id="profile-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
            error={error}
          />
          <p className="text-xs text-slate-500">Role: <span className="font-medium text-slate-900">{user?.role}</span></p>

          <Button type="submit" full loading={saving} disabled={!hasChanges || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </>
  )
}