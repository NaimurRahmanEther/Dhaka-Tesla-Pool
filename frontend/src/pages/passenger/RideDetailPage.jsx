import { useState } from 'react'
import { useParams } from 'react-router-dom'
import FareBreakdown from '@/components/ride/FareBreakdown'
import RouteSummary from '@/components/ride/RouteSummary'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  LinkButton,
  PageHeader,
  Spinner,
} from '@/components/ui'
import useApi from '@/hooks/useApi'
import usePolling from '@/hooks/usePolling'
import { canCancelRide, formatDateTime } from '@/lib/format'
import { RIDE_STATUS_ORDER } from '@/lib/constants'
import rideService from '@/services/ride.service'

const labels = {
  REQUESTED: 'Requested',
  MATCHED: 'Accepted',
  DRIVER_ARRIVED: 'Driver arrived',
  ONGOING: 'On the way',
  COMPLETED: 'Completed',
  ACCEPTED: 'Accepted by a driver',
  STARTED: 'Trip started',
  CANCELLED: 'Cancelled',
}
export default function RideDetailPage() {
  const { rideId: param } = useParams()
  const rideId = Number(param)
  const rides = useApi(rideService.getMyRides, [])
  const history = useApi(() => rideService.getRideHistory(rideId), [rideId])
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const ride = (rides.data ?? []).find((item) => item.id === rideId)
  const refresh = (options) => {
    rides.reload(options)
    history.reload(options)
  }
  usePolling(
    refresh,
    Boolean(ride && !['COMPLETED', 'CANCELLED'].includes(ride.status) && !cancelling),
  )
  async function cancel() {
    setCancelling(true)
    setCancelError(null)
    try {
      await rideService.cancelRide(rideId)
      setConfirming(false)
      refresh()
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setCancelling(false)
    }
  }
  if (rides.loading && rides.data === null)
    return (
      <div className="py-20">
        <Spinner label="Loading your ride" />
      </div>
    )
  if (rides.error)
    return (
      <>
        <PageHeader title="Your ride" />
        <Alert className="mt-6" tone="error">
          {rides.error.message}
        </Alert>
        <Button className="mt-4" onClick={() => refresh()}>
          Try again
        </Button>
      </>
    )
  if (!ride)
    return (
      <EmptyState
        title="We couldn’t find that ride"
        description="It may not belong to your account. You can find your journeys in My rides."
      >
        <LinkButton to="/my-rides">Back to my rides</LinkButton>
      </EmptyState>
    )
  const step = RIDE_STATUS_ORDER.indexOf(ride.status)
  return (
    <>
      <LinkButton variant="secondary" to="/my-rides" className="mb-6 px-3 py-2 text-xs">
        <Icon name="back" className="h-4 w-4" />
        My rides
      </LinkButton>
      <PageHeader
        title={'Ride #' + ride.id}
        description={ride.pickup_location + ' → ' + ride.destination_location}
        eyebrow="YOUR JOURNEY"
      >
        <Badge status={ride.status} />
        <Button variant="secondary" size="sm" loading={rides.loading} onClick={() => refresh()}>
          <Icon name="refresh" className="h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>
      {cancelError && (
        <Alert tone="error" className="mt-6">
          {cancelError}
        </Alert>
      )}
      {ride.status !== 'CANCELLED' && (
        <Card className="mt-8">
          <ol aria-label="Ride progress" className="grid gap-4 sm:grid-cols-5">
            {RIDE_STATUS_ORDER.map((status, i) => (
              <li
                key={status}
                aria-current={i === step ? 'step' : undefined}
                className="flex items-center gap-3 sm:flex-col sm:items-start"
              >
                <span
                  className={
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                    (i <= step ? 'bg-brand-800 text-lime-300' : 'bg-slate-100 text-slate-500')
                  }
                >
                  {i < step ? <Icon name="check" className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={
                    'text-xs font-semibold ' + (i <= step ? 'text-brand-800' : 'text-slate-500')
                  }
                >
                  {labels[status]}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-6 text-lg font-bold text-brand-900">Journey details</h2>
            <RouteSummary pickup={ride.pickup_location} destination={ride.destination_location} />
            <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-5 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <Icon name="users" className="h-4 w-4" />
                {ride.seats_requested} seat(s)
              </span>
              <span className="flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4" />
                {formatDateTime(ride.requested_at)}
              </span>
            </div>
          </Card>
          <Card>
            <h2 className="mb-6 text-lg font-bold text-brand-900">Along the way</h2>
            {history.loading && history.data === null ? (
              <Spinner label="Loading ride timeline" />
            ) : history.error ? (
              <Alert tone="error">{history.error.message}</Alert>
            ) : history.data?.timeline?.length ? (
              <ol>
                {history.data.timeline.map((event, i, events) => (
                  <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < events.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-4 left-[7px] h-full w-px bg-brand-100"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-brand-50 bg-brand-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {labels[event.action] ?? event.action}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {event.actor_name} · {formatDateTime(event.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">Your journey updates will appear here.</p>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-5 text-lg font-bold text-brand-900">Your fare, explained.</h2>
            {ride.fare_breakdown ? (
              <FareBreakdown breakdown={ride.fare_breakdown} />
            ) : (
              <Alert>Your fare will appear when a driver accepts this ride.</Alert>
            )}
            {ride.status === 'COMPLETED' && (
              <LinkButton to="/payments" className="mt-5 w-full">
                View payments <Icon name="arrow" />
              </LinkButton>
            )}
          </Card>
          {canCancelRide(ride.status) && (
            <Card>
              <h2 className="font-semibold text-slate-800">Plans changed?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                You can cancel before your driver arrives.
              </p>
              {confirming ? (
                <div className="mt-4">
                  <Alert tone="error">
                    Cancel this ride? You’ll need to request a new ride if you change your mind.
                  </Alert>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="danger" loading={cancelling} onClick={cancel}>
                      Yes, cancel ride
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={cancelling}
                      onClick={() => setConfirming(false)}
                    >
                      Keep my ride
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="mt-4 text-red-700"
                  onClick={() => setConfirming(true)}
                >
                  Cancel ride
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
