import { useState } from 'react'
import { Link } from 'react-router-dom'

import PassengerManifest from '@/components/driver/PassengerManifest'
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import { RIDE_STATUS } from '@/lib/constants'
import poolService from '@/services/pool.service'
import tripService from '@/services/trip.service'

// The forward-only lifecycle a driver walks: MATCHED -> DRIVER_ARRIVED ->
// ONGOING -> COMPLETED, plus the passenger manifest for the current pool.
//
// GET /trips/my-active returns one row per rider in the pool (pool_id, vehicle,
// passenger, ride_status) or a 404 when there is no trip — that 404 is the
// empty state here. The poolId for every action and for the manifest comes from
// that response; it is never guessed.
const STEPS = [
  { key: 'arrive', verb: 'Mark arrived', hint: 'You have reached the pickup point' },
  { key: 'start', verb: 'Start trip', hint: 'All riders are in the car' },
  { key: 'complete', verb: 'Complete trip', hint: 'Finish and settle every fare' },
]

const STEP_INDEX = {
  [RIDE_STATUS.MATCHED]: 0,
  [RIDE_STATUS.DRIVER_ARRIVED]: 1,
  [RIDE_STATUS.ONGOING]: 2,
}

const ACTION_CALLS = {
  arrive: tripService.arrive,
  start: tripService.start,
  complete: tripService.complete,
}

export default function ActiveTripPage() {
  const {
    data: tripRows,
    loading: tripLoading,
    error: tripError,
    reload: reloadTrip,
  } = useApi(() => tripService.getMyActiveTrip(), [])

  const [busyAction, setBusyAction] = useState(null)
  const [notice, setNotice] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [tripEnded, setTripEnded] = useState(false)

  const noTrip = tripError?.status === 404

  // Every rider row shares the pool and the ride status, so the first row is
  // the trip's source of truth.
  const poolId = tripRows?.[0]?.pool_id
  const currentStep = tripRows?.[0] ? STEP_INDEX[tripRows[0].ride_status] : -1

  const {
    data: manifest,
    loading: manifestLoading,
    error: manifestError,
  } = useApi(
    () => (poolId ? poolService.getPoolPassengers(poolId) : Promise.resolve(null)),
    [poolId],
  )

  async function runAction(stepKey) {
    if (!poolId) return

    setBusyAction(stepKey)
    setNotice(null)
    setActionError(null)

    try {
      await ACTION_CALLS[stepKey](poolId)

      if (stepKey === 'complete') {
        // The pool closes, so the active-trip endpoint 404s afterwards. The
        // ended panel replaces the trip card instead of the empty state.
        setTripEnded(true)
      } else {
        setNotice(
          stepKey === 'arrive'
            ? 'Marked as arrived — waiting for the riders to get in.'
            : 'Trip started — enjoy the drive.',
        )
      }
      reloadTrip()
    } catch (err) {
      // A 409 here means the lifecycle rejected the action (e.g. start before
      // arrive) — surface the backend's reason, nothing has changed.
      setActionError(err.message)
    } finally {
      setBusyAction(null)
    }
  }

  if (tripLoading && tripRows === null) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Active trip"
        description="Drive your riders through the trip — the manifest follows the lifecycle."
      />

      {tripEnded && (
        <Card className="mt-6 border-emerald-200">
          <h2 className="text-lg font-semibold text-slate-900">Trip completed</h2>
          <p className="mt-1 text-sm text-slate-500">
            Every rider&apos;s fare has been settled and this trip is no longer active.
          </p>
        </Card>
      )}

      {!tripEnded && noTrip && (
        <div className="mt-8">
          <EmptyState
            title="No active trip"
            description="When you accept a request on the board, the trip and its passengers appear here."
          >
            <Link
              to="/requests"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Open request board
            </Link>
          </EmptyState>
        </div>
      )}

      {tripError && !noTrip && !tripEnded && (
        <div className="mt-8 max-w-md">
          <Alert tone="error">{tripError.message}</Alert>
          <Button className="mt-4" onClick={reloadTrip}>
            Try again
          </Button>
        </div>
      )}

      {tripRows && !tripEnded && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{tripRows[0].model}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {tripRows.length} rider{tripRows.length > 1 ? 's' : ''} in the pool · pool #{poolId}
              </p>
            </div>
            <Badge status={tripRows[0].ride_status} />
          </div>

          {notice && (
            <div className="mt-6">
              <Alert tone="info">{notice}</Alert>
            </div>
          )}

          {actionError && (
            <div className="mt-6">
              <Alert tone="error">{actionError}</Alert>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Trip progress</h3>
            <div className="mt-4 space-y-3">
              {STEPS.map((step, index) => {
                const done = currentStep > index
                const active = currentStep === index
                return (
                  <div
                    key={step.key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {index + 1}. {step.verb}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{step.hint}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={active ? 'primary' : 'secondary'}
                      loading={busyAction === step.key}
                      disabled={!active || busyAction !== null}
                      onClick={() => runAction(step.key)}
                    >
                      {done ? 'Done' : step.verb}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            {manifest && <PassengerManifest manifest={manifest} />}
            {poolId && manifestLoading && manifest === null && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {poolId && manifestError && <Alert tone="error">{manifestError.message}</Alert>}
          </div>
        </Card>
      )}
    </>
  )
}