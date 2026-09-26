import { Link } from 'react-router-dom'
import Brand from '@/components/layout/Brand'
import { Alert, Button, Icon, LinkButton } from '@/components/ui'
import RouteArt from '@/components/ui/RouteArt'
import useApi from '@/hooks/useApi'
import useAuth from '@/hooks/useAuth'
import { dashboardPathFor } from '@/routes/dashboardPath'
import locationService from '@/services/location.service'

const steps = [
  ['pin', 'Pick your journey', 'Choose your pickup, destination, and the seats you need.'],
  [
    'users',
    'Find your people',
    'An available driver accepts your request. Join a pool to share the trip.',
  ],
  ['car', 'Enjoy the ride', 'Follow your trip status and pay when you arrive. Simple as that.'],
]

export default function LandingPage() {
  const locations = useApi(locationService.getAll, [])
  const { user } = useAuth()
  const start = user ? dashboardPathFor(user.role) : '/register'
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-10">
        <Brand />
        <nav aria-label="Public navigation" className="flex items-center gap-3 sm:gap-7">
          <a
            href="#how-it-works"
            className="hidden text-sm font-medium text-slate-500 hover:text-brand-800 md:block"
          >
            How it works
          </a>
          {user ? (
            <LinkButton to={start}>
              My dashboard <Icon name="arrow" />
            </LinkButton>
          ) : (
            <>
              <Link to="/login" className="text-link py-3 text-sm">
                Log in
              </Link>
              <LinkButton to="/register" className="px-4">
                Get started <Icon name="arrow" />
              </LinkButton>
            </>
          )}
        </nav>
      </header>
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 pt-9 pb-16 sm:px-10 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pb-24">
          <div className="page-enter">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Made for moving through Dhaka
            </span>
            <h1 className="mt-7 text-5xl leading-[1.06] font-bold tracking-[-0.045em] text-brand-900 sm:text-6xl xl:text-7xl">
              Your city.
              <br />
              Your people.
              <br />
              <span className="text-brand-500">One shared ride.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-500 sm:text-lg">
              A better way across Dhaka. Find a Tesla, share the journey, and make your everyday
              commute a little lighter.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to={start}>
                Let’s get moving <Icon name="arrow" />
              </LinkButton>
              <LinkButton variant="secondary" to={user ? start : '/register?role=DRIVER'}>
                I want to drive
              </LinkButton>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-2">
                <Icon name="wallet" className="h-4 w-4 text-brand-600" />
                Clear fare breakdowns
              </span>
              <span className="flex items-center gap-2">
                <Icon name="leaf" className="h-4 w-4 text-brand-600" />
                More journeys, shared
              </span>
            </div>
          </div>
          <div className="relative rounded-[2rem] bg-brand-900 p-5 pt-8 sm:p-8">
            <div className="mb-4 flex items-center justify-between text-xs font-medium text-white/60">
              <span className="flex items-center gap-2">
                <Icon name="route" className="text-lime-300" />
                Going the same way?
              </span>
              <span>DHAKA / BD</span>
            </div>
            <RouteArt className="w-full" />
            <div className="mt-3 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime-300 text-brand-900">
                <Icon name="users" />
              </span>
              <div>
                <p className="font-semibold text-white">There’s room for together.</p>
                <p className="mt-1 text-sm text-white/55">
                  Share a seat. Make the most of the ride.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-slate-200 bg-white/70">
          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-10">
            <p className="eyebrow mb-4">Find your neighbourhood</p>
            {locations.loading && (
              <p role="status" className="text-sm text-slate-500">
                Finding available stops…
              </p>
            )}
            {locations.error && (
              <div className="flex flex-wrap items-center gap-3">
                <Alert tone="error">We couldn’t load the stops. Please try again.</Alert>
                <Button variant="secondary" size="sm" onClick={locations.reload}>
                  Retry
                </Button>
              </div>
            )}
            {locations.data?.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {locations.data.map((place) => (
                  <li
                    key={place.id}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                  >
                    <Icon name="pin" className="h-3.5 w-3.5 text-brand-500" />
                    {place.name}
                  </li>
                ))}
              </ul>
            )}
            {locations.data?.length === 0 && (
              <p className="text-sm text-slate-500">New stops are on the way. Check back soon.</p>
            )}
          </div>
        </section>
        <section
          id="how-it-works"
          className="mx-auto max-w-7xl scroll-mt-6 px-5 py-16 sm:px-10 lg:py-24"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Less planning. More living.</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                From here to there, together.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-slate-500">
              Your next journey is just a few simple steps away.
            </p>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(([icon, title, body], i) => (
              <li key={title} className="rounded-2xl border border-slate-200 bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={icon} className="h-6 w-6" />
                  </span>
                  <span className="text-3xl font-light text-slate-200">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-brand-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-7 rounded-3xl bg-brand-900 p-8 sm:p-12">
            <div>
              <p className="text-xs font-bold tracking-widest text-lime-300 uppercase">
                Take the wheel
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
                Your Tesla. A better commute for everyone.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                Set up your car, choose the requests that work for you, and bring people along.
              </p>
            </div>
            <LinkButton variant="light" to={user ? start : '/register?role=DRIVER'}>
              Start driving <Icon name="arrow" />
            </LinkButton>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 border-t border-slate-200 px-5 py-8 sm:px-10">
        <Brand />
        <p className="text-xs text-slate-500">Good journeys are better shared. Made for Dhaka.</p>
      </footer>
    </div>
  )
}
