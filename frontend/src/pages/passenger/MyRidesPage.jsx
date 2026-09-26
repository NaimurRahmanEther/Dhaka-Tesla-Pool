import { Link } from 'react-router-dom'

import { Alert, Badge, Button, EmptyState, PageHeader, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import { formatDateTime, formatTaka } from '@/lib/format'
import rideService from '@/services/ride.service'

// The passenger's ride list. Every row comes from GET /rides/my, which the
// backend already joins with the pickup and destination names - no name lookup
// here. Each card links to the ride detail page at /my-rides/:id.
//
// fare is NULL until a driver matches the ride, so a card shows a dash instead
// of inventing a number; the fare (and its breakdown) appears on the detail
// page once the backend has written it.
export default function MyRidesPage() {
  const { data: rides, loading, error, reload } = useApi(() => rideService.getMyRides(), [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="My rides" description="Your requests, from queued to completed." />
        <div className="mt-8 max-w-md">
          <Alert tone="error">{error.message}</Alert>
          <Button className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      </>
    )
  }

  if (!rides?.length) {
    return (
      <>
        <PageHeader title="My rides" description="Your requests, from queued to completed." />
        <div className="mt-8">
          <EmptyState
            title="No rides yet"
            description="Every ride you request will appear here, from queued to completed."
          >
            <Link
              to="/request"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Request a ride
            </Link>
          </EmptyState>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="My rides" description="Your requests, from queued to completed." />

      <div className="mt-8 space-y-4">
        {rides.map((ride) => (
          <Link
            key={ride.id}
            to={`/my-rides/${ride.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {ride.pickup_location} → {ride.destination_location}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {ride.seats_requested} seat{ride.seats_requested === 1 ? '' : 's'} · {formatDateTime(ride.requested_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={ride.status} />
                <span className="text-sm font-semibold text-slate-900">
                  {ride.fare == null ? '—' : `${formatTaka(ride.fare)} BDT`}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}