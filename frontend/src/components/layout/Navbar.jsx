import { Link, NavLink } from 'react-router-dom'

import { Button } from '@/components/ui'
import PageContainer from '@/components/layout/PageContainer'
import useAuth from '@/hooks/useAuth'
import { ROLES } from '@/lib/constants'
import { dashboardPathFor } from '@/routes/dashboardPath'

// Role-aware navigation, derived from user.role - the one source of truth. A
// driver must never see "Request a ride", so each role gets its own link set.
// The paths agree with the phase plan: Phases 7-14 mount pages at these URLs
// (404 until then, which is the accepted in-progress state here).
const NAV_LINKS = {
  [ROLES.PASSENGER]: [
    { to: '/request', label: 'Request a ride' },
    { to: '/my-rides', label: 'My rides' },
    { to: '/payments', label: 'Payments' },
    { to: '/history', label: 'History' },
  ],
  [ROLES.DRIVER]: [
    { to: '/tesla', label: 'My Tesla' },
    { to: '/requests', label: 'Requests' },
    { to: '/active-trip', label: 'Active trip' },
    { to: '/history', label: 'History' },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()

  // Rendered only inside AppShell, which only mounts behind ProtectedRoute, so
  // a user is always present here. The guard is what makes this safe to trust.
  if (!user) return null

  const links = NAV_LINKS[user.role] ?? []

  return (
    <header className="border-b border-slate-200 bg-white">
      <PageContainer className="flex h-14 items-center justify-between gap-4">
        <Link
          to={dashboardPathFor(user.role)}
          className="text-sm font-bold tracking-tight text-slate-900"
        >
          Dhaka Tesla Pool
        </Link>
        <nav className="flex items-center gap-5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive ? 'text-sky-700' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <span className="text-sm font-medium text-slate-900">{user.name}</span>
          <Button size="sm" variant="secondary" onClick={() => logout()}>
            Log out
          </Button>
        </nav>
      </PageContainer>
    </header>
  )
}