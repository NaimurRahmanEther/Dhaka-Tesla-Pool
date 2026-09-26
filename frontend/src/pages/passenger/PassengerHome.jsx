import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/ui'
import useAuth from '@/hooks/useAuth'

// The passenger's home. It is a hub of links, not a data page: each card points
// at a feature page that lands in a later phase (request, my rides, payments,
// history). Until then those URLs render the not-found page - accepted
// in-progress state, same as every earlier phase.
const FEATURES = [
  {
    to: '/request',
    title: 'Request a ride',
    body: 'Pick a pickup point, a destination and how many seats you need.',
  },
  {
    to: '/my-rides',
    title: 'My rides',
    body: 'Track every request, from queued to completed, and cancel while you can.',
  },
  {
    to: '/payments',
    title: 'Payments',
    body: 'Pay by cash or Tesla wallet once your ride is done.',
  },
  {
    to: '/history',
    title: 'History',
    body: 'Every ride you have taken, in one list.',
  },
]

export default function PassengerHome() {
  const { user } = useAuth()

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Where do you want to go today?"
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