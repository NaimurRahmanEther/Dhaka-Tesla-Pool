import { Link } from 'react-router-dom'
import { Icon, LinkButton, PageHeader } from '@/components/ui'
import RouteArt from '@/components/ui/RouteArt'
import useAuth from '@/hooks/useAuth'

const passengerLinks = [
  ['/my-rides', 'My rides', 'Check in on your requests and follow each journey.', 'route'],
  ['/join-pool', 'Better together', 'Have a pool ID? Join a driver’s existing trip.', 'users'],
  ['/payments', 'Payments', 'Settle completed rides and find your receipts.', 'wallet'],
  ['/history', 'Your journeys', 'A look back at every ride along the way.', 'clock'],
]
const driverLinks = [
  ['/tesla', 'Your Tesla', 'Manage your car, availability, and planned route.', 'car'],
  ['/requests', 'Ride requests', 'Find passengers whose journeys fit your trip.', 'users'],
  ['/active-trip', 'On the road', 'See your passengers and manage your active trip.', 'route'],
  ['/history', 'Trip history', 'Revisit your completed trips and passenger fares.', 'clock'],
]
export default function Dashboard({ driver = false, children }) {
  const { user } = useAuth()
  return (
    <>
      <PageHeader
        eyebrow={driver ? 'YOUR DRIVER SPACE' : 'YOUR PASSENGER SPACE'}
        title={'Hey, ' + user.name.split(' ')[0] + '.'}
        description={
          driver
            ? 'A new day, a few familiar roads, and people to bring along.'
            : 'Wherever today takes you, let’s get there together.'
        }
      />
      <section className="relative mt-8 grid overflow-hidden rounded-3xl bg-brand-900 sm:grid-cols-[1.3fr_1fr]">
        <div className="relative z-10 p-7 sm:p-9">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-lime-300">
            <Icon name={driver ? 'car' : 'leaf'} className="h-4 w-4" />
            {driver ? 'Make room for a shared journey' : 'Your next journey starts here'}
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-white">
            {driver
              ? 'Your route.\nTheir next ride.'
              : 'A little less rush.\nA better way to ride.'}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
            {driver
              ? 'Go online and find ride requests that fit your Tesla.'
              : 'Choose your stops, request a seat, and let a driver take it from there.'}
          </p>
          <LinkButton to={driver ? '/requests' : '/request'} variant="light" className="mt-6">
            {driver ? 'Find ride requests' : 'Request a ride'}
            <Icon name="arrow" />
          </LinkButton>
        </div>
        <div className="hidden items-center pr-5 sm:flex">
          <RouteArt className="w-full rotate-3 opacity-95" />
        </div>
      </section>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-900">Your everyday essentials</h2>
        <span className="hidden text-xs text-slate-500 sm:block">Everything, one place.</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(driver ? driverLinks : passengerLinks).map(([to, title, body, icon]) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon name={icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-brand-900">{title}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">{body}</span>
            </span>
            <Icon
              name="arrow"
              className="mt-1 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-700"
            />
          </Link>
        ))}
      </div>
      {children}
    </>
  )
}
