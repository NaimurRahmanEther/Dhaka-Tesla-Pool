import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/ui'
import useAuth from '@/hooks/useAuth'

// The driver's home. Same shape as the passenger home: a hub of links to the
// features that land in later phases (my Tesla, request board, active trip,
// history). The pages themselves show live data when their phases mount them.
const FEATURES = [
  {
    to: '/tesla',
    title: 'My Tesla',
    body: 'Register your car, go online and plan where you are driving next.',
  },
  {
    to: '/requests',
    title: 'Request board',
    body: 'See every open request, its detour and whether it fits your seats.',
  },
  {
    to: '/active-trip',
    title: 'Active trip',
    body: 'Run the trip: arrivals, and the manifest of riders in your car.',
  },
  {
    to: '/history',
    title: 'History',
    body: 'Every trip you have driven, fares included.',
  },
]

export default function DriverHome() {
  const { user } = useAuth()

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Your Tesla, your fares, your calls."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.body}</p>
          </Link>
        ))}
      </div>
    </>
  )
}