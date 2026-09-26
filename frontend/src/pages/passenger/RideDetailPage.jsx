import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import FareBreakdown from '@/components/ride/FareBreakdown'
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import { canCancelRide, formatDateTime } from '@/lib/format'
import rideService from '@/services/ride.service'

// The backend has no GET /rides/:id (confirmed against ride.routes.js), so this
// page loads the passenger's whole list and finds the row by the URL's :id,
// then fetches the ride's timeline separately. Two requests, for one ride -
// that is a backend limitation, not a choice.
//
// The cancel button renders only while the backend would actually accept it
// (REQUESTED or MATCHED, decided by canCancelRide in lib/) - after that the
// seats are committed and a cancel would be rejected anyway.
const TIMELINE_LABELS = {
  REQUESTED: 'Requested',
  ACCEPTED: 'Accepted by a driver',
  DRIVER_ARRIVED: 'Driver arrived',
  STARTED: 'Trip started',
  COMPLETED: 'Trip completed',
  CANCELLED: 'Cancelled',
}

export default function RideDetailPage() {
  const { id } = useParams()
  const rideId = Number(id)

  const {
    data: rides,
    loading: ridesLoading,
    error: ridesError,
    reload: reloadRides,
  } = useApi(() => rideService.getMyRides(), [])

  const {
    data: history,
    loading: timelineLoading,
    error: timelineError,
    reload: reloadTimeline,
  } = useApi(() => rideService.getRideHistory(rideId), [rideId])

  // The history endpoint returns { ride, timeline } — the ride is a formatted,
  // camelCase subset, and the timeline is the ordered event list. The page
  // keeps using the /rides/my row for display (it carries the location names
  // and fare_breakdown) and only borrows the `timeline` array from here.
  const timeline = history?.timeline ?? []

  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const [justCancelled, setJustCancelled] = useState(false)

  const ride = (rides ?? []).find((item) => item.id === rideId)

  async function handleCancel() {
    setCancelling(true)
    setCancelError(null)
    try {
      await rideService.cancelRide(rideId)
      setJustCancelled(true)
      // The ride's status and its timeline both changed on the server; refresh
      // the list (for the badge) and the timeline (for the CANCELLED event).
      reloadRides()
      reloadTimeline()
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  if (ridesLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (ridesError) {
    return (
      <>
        <PageHeader title="Ride" description="This ride could not be loaded." />
        <div className="mt-8 max-w-md">
          <Alert tone="error">{ridesError.message}</Alert>
          <Button className="mt-4" onClick={reloadRides}>
            Try again
          </Button>
        </div>
      </>
    )
  }

  // A deep link or a stale URL can point at a ride id that is not in this
  // passenger's list. Show a calm empty state instead of a crash.
  if (!ride) {
    return (
      <>
        <PageHeader title="Ride" description="This ride could not be found." />
        <div className="mt-8">
          <EmptyState
            title="Ride not in your list"
            description="The address you followed does not match any of your rides. It may be a stale link."
          >
            <Link
              to="/my-rides"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Back to my rides
            </Link>
          </EmptyState>
        </div>
      </>
    )
  }

  const showCancel = canCancelRide(ride.status)

  return (
    <>
      <PageHeader title={`Ride #${ride.id}`} description={`${ride.pickup_location} → ${ride.destination_location}`} />

      {justCancelled && (
        <div className="mt-6">
          <Alert tone="success">Ride cancelled.</Alert>
        </div>
      )}
      {cancelError && (
        <div className="mt-6">
          <Alert tone="error">{cancelError}</Alert>
        </div>
      )}

      <Card className="mt-6">
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <Badge status={ride.status} />
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">Route</dt>
            <dd className="font-medium text-slate-900">
              {ride.pickup_location} → {ride.destination_location}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">Seats</dt>
            <dd className="font-medium text-slate-900">{ride.seats_requested}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">Requested</dt>
            <dd className="font-medium text-slate-900">{formatDateTime(ride.requested_at)}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Fare breakdown</h2>
          <div className="mt-2">
            {ride.fare_breakdown ? (
              <FareBreakdown breakdown={ride.fare_breakdown} />
            ) : (
              <p className="text-sm text-slate-500">
                The fare is calculated the moment a driver accepts your ride — the breakdown appears here then.
              </p>
            )}
          </div>
        </div>

        {showCancel && (
          <div className="mt-6 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-800">
              This ride is still {ride.status.toLowerCase()}. You can cancel it while no driver is on the way.
            </p>
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>
              Cancel ride
            </Button>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Timeline</h2>

        {timelineLoading && (
          <div className="mt-4 flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {timelineError && (
          <div className="mt-4">
            <Alert tone="error">{timelineError.message}</Alert>
          </div>
        )}

        {!timelineLoading && !timelineError && (
          <ol className="mt-4 space-y-0">
            {timeline.map((event, index) => (
              <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                {index < timeline.length - 1 && (
                  <span className="absolute top-5 left-[5px] h-full w-px bg-slate-200" aria-hidden="true" />
                )}
                <span
                  className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-white ${
                    index === timeline.length - 1 ? 'bg-slate-900' : 'bg-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {TIMELINE_LABELS[event.action] ?? event.action}
                  </p>
                  <p className="text-xs text-slate-500">
                    {event.actor_name} · {formatDateTime(event.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  )
}