import { Card, PageHeader } from '@/components/ui'
import useAuth from '@/hooks/useAuth'

// Placeholder for Phase 6 only. It renders the signed-in user from the auth
// context - the same object /users/me returned when the session was restored -
// so this page proves live data reaches a signed-in page without any fetching
// of its own. Phase 14 turns it into the full profile: edit name and email via
// PATCH /users/me.
export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <>
      <PageHeader title="Profile" description="Your account details." />

      <Card className="mt-8">
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900">{user.name}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium text-slate-900">{user.role}</dd>
          </div>
        </dl>
      </Card>
    </>
  )
}