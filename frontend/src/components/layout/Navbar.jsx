import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Brand from '@/components/layout/Brand'
import { Icon } from '@/components/ui'
import useAuth from '@/hooks/useAuth'
import { ROLES } from '@/lib/constants'
import { dashboardPathFor } from '@/routes/dashboardPath'

const links = {
  PASSENGER: [
    ['/passenger', 'Overview', 'home'],
    ['/request', 'Request a ride', 'plus'],
    ['/my-rides', 'My rides', 'route'],
    ['/join-pool', 'Join a pool', 'users'],
    ['/payments', 'Payments', 'wallet'],
    ['/history', 'Ride history', 'clock'],
  ],
  DRIVER: [
    ['/driver', 'Overview', 'home'],
    ['/tesla', 'My Tesla', 'car'],
    ['/requests', 'Ride requests', 'users'],
    ['/active-trip', 'Active trip', 'route'],
    ['/history', 'Trip history', 'clock'],
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [openFor, setOpenFor] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const open = openFor === location.pathname
  if (!user) return null
  const role = user.role === ROLES.DRIVER ? 'Driver' : 'Passenger'
  async function handleLogout() {
    setLeaving(true)
    await logout()
    setLeaving(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex min-h-18 items-center justify-between gap-3 border-b border-slate-200 bg-canvas/95 px-4 backdrop-blur lg:hidden">
        <Brand to={dashboardPathFor(user.role)} />
        <button
          type="button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="app-navigation"
          onClick={() => setOpenFor(open ? null : location.pathname)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-800"
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </header>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 top-18 z-30 bg-brand-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpenFor(null)}
        />
      )}
      <aside
        id="app-navigation"
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpenFor(null)
        }}
        className={
          (open ? 'flex' : 'hidden') +
          ' fixed top-18 bottom-0 left-0 z-40 w-64 flex-col overflow-y-auto bg-brand-900 px-5 py-7 text-white lg:top-0 lg:flex lg:w-64 lg:py-9'
        }
      >
        <div className="mb-10 hidden px-1 lg:block">
          <Brand light to={dashboardPathFor(user.role)} />
        </div>
        <p className="mb-4 px-3 text-[10px] font-bold tracking-[0.22em] text-white/45 uppercase">
          {role} workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1.5">
          {(links[user.role] ?? []).map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/passenger' || to === '/driver'}
              onClick={() => setOpenFor(null)}
              className={({ isActive }) =>
                'flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition ' +
                (isActive
                  ? 'bg-lime-300 text-brand-900 shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white')
              }
            >
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-9">
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Icon name="leaf" className="mb-3 text-lime-300" />
            <p className="text-sm font-semibold">A little less traffic.</p>
            <p className="mt-1 text-xs leading-5 text-white/55">
              More shared journeys. A little more room for Dhaka.
            </p>
          </div>
          <Link
            to="/profile"
            onClick={() => setOpenFor(null)}
            className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-lime-300">
              {user.name?.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{user.name}</span>
              <span className="text-xs text-white/50">View your profile</span>
            </span>
            <Icon name="arrow" className="h-4 w-4 text-white/40" />
          </Link>
          <button
            disabled={leaving}
            onClick={handleLogout}
            className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <Icon name="logout" className="h-4 w-4" />
            {leaving ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      </aside>
    </>
  )
}
