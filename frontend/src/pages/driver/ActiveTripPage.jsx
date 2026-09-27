import { useState } from 'react'
import PassengerManifest from '@/components/driver/PassengerManifest'
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
import poolService from '@/services/pool.service'
import tripService from '@/services/trip.service'

const steps = [
  {
    key: 'arrive',
    title: 'Arrive at pickup',
    hint: 'Let your passengers know you’re at the pickup point.',
    label: 'Mark as arrived',
  },
  {
    key: 'start',
    title: 'Everyone on board',
    hint: 'Start the trip once your passengers are in the car.',
    label: 'Start trip',
  },
  {
    key: 'complete',
    title: 'You’ve arrived',
    hint: 'Complete the trip once your passengers reach their destinations.',
    label: 'Complete trip',
  },
]
const indexes = { MATCHED: 0, DRIVER_ARRIVED: 1, ONGOING: 2 }
const calls = {
  arrive: tripService.arrive,
  start: tripService.start,
  complete: tripService.complete,
}

export default function ActiveTripPage() {
  const trip = useApi(tripService.getMyActiveTrip, [])
  const [busy, setBusy] = useState(null)
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [ended, setEnded] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const rows = trip.data ?? []
  const poolId = rows[0]?.pool_id
  const manifest = useApi(
    () => (poolId ? poolService.getPoolPassengers(poolId) : Promise.resolve(null)),
    [poolId],
  )
  const current = rows.length ? Math.min(...rows.map((r) => indexes[r.ride_status] ?? 3)) : -1
  const refresh = (options) => {
    trip.reload(options)
    manifest.reload(options)
  }
  usePolling(refresh, Boolean(poolId && !ended && !busy))
  async function act(key) {
    setBusy(key)
    setError(null)
    setNotice(null)
    try {
      await calls[key](poolId)
      if (key === 'complete') {
        setEnded(true)
        setConfirm(false)
      } else
        setNotice(
          key === 'arrive'
            ? 'Your passengers can see that you’ve arrived.'
            : 'Your trip is underway. Have a good journey.',
        )
      refresh()
    } catch (err) {
      setError(err.message)
      refresh()
    } finally {
      setBusy(null)
    }
  }
  return (
    <>
      <PageHeader
        title="Make it a good journey."
        description="Your passengers, your stops, and the next step along the way."
        eyebrow="ACTIVE TRIP"
      >
        {!ended && (
          <Button
            variant="secondary"
            size="sm"
            loading={trip.loading}
            disabled={busy !== null}
            onClick={() => refresh()}
          >
            <Icon name="refresh" className="h-4 w-4" />
            Refresh
          </Button>
        )}
      </PageHeader>
      {ended ? (
        <Card className="mt-8">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon name="check" className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-brand-900">Another journey, well shared.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
            Your trip is complete. Passengers can now pay their fares from the Payments page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton to="/requests">
              Find your next ride <Icon name="arrow" />
            </LinkButton>
            <LinkButton variant="secondary" to="/history">
              View trip history
            </LinkButton>
          </div>
        </Card>
      ) : trip.loading && trip.data === null ? (
        <div className="py-20">
          <Spinner label="Loading active trip" />
        </div>
      ) : trip.error?.status === 404 || (!trip.error && !rows.length) ? (
        <EmptyState
          className="mt-8"
          icon="car"
          title="Ready for your next journey"
          description="Accept a passenger request to start a new trip. Your passengers and trip controls will appear here."
        >
          <LinkButton to="/requests">
            Find ride requests <Icon name="arrow" />
          </LinkButton>
        </EmptyState>
      ) : trip.error ? (
        <Alert tone="error" className="mt-8">
          {trip.error.message}
        </Alert>
      ) : (
        <>
          {notice && (
            <Alert tone="success" className="mt-6">
              {notice}
            </Alert>
          )}
          {error && (
            <Alert tone="error" className="mt-6">
              {error}
            </Alert>
          )}
          <Card className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name="car" className="h-7 w-7" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-brand-900">{rows[0].model}</h2>
                  <p className="mt-1 text-sm text-slate-500">{rows.length} ride(s) in this trip</p>
                </div>
              </div>
              <div className="rounded-xl bg-canvas px-5 py-3">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  Share with passengers
                </p>
                <p className="mt-1 text-lg font-bold text-brand-900">Pool #{poolId}</p>
              </div>
            </div>
          </Card>
          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_1.25fr]">
            <Card>
              <h2 className="mb-6 text-lg font-bold text-brand-900">Next stop, the next step.</h2>
              <ol className="space-y-5">
                {steps.map((step, i) => (
                  <li
                    key={step.key}
                    className={
                      'rounded-xl border p-4 ' +
                      (current === i ? 'border-brand-100 bg-brand-50' : 'border-slate-100')
                    }
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                          (current >= i
                            ? 'bg-brand-800 text-lime-300'
                            : 'bg-slate-100 text-slate-500')
                        }
                      >
                        {current > i ? <Icon name="check" className="h-4 w-4" /> : i + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-brand-900">{step.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{step.hint}</p>
                      </div>
                    </div>
                    {current === i && (
                      <div className="mt-4">
                        {step.key === 'complete' && confirm ? (
                          <>
                            <p className="mb-3 text-sm text-brand-800">
                              Have all passengers reached their destination? Completing closes this
                              pool.
                            </p>
                            <Button loading={busy === step.key} onClick={() => act(step.key)}>
                              Yes, complete trip
                            </Button>
                            <Button
                              variant="secondary"
                              className="mt-2"
                              disabled={busy !== null}
                              onClick={() => setConfirm(false)}
                            >
                              Keep trip open
                            </Button>
                          </>
                        ) : (
                          <Button
                            full
                            loading={busy === step.key}
                            disabled={busy !== null}
                            onClick={() =>
                              step.key === 'complete' ? setConfirm(true) : act(step.key)
                            }
                          >
                            {step.label}
                            <Icon name="arrow" />
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
            <Card>
              {manifest.error ? (
                <Alert tone="error">{manifest.error.message}</Alert>
              ) : manifest.data ? (
                <PassengerManifest manifest={manifest.data} />
              ) : (
                <Spinner label="Loading passenger manifest" />
              )}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <Badge status="ACTIVE" />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Passenger details refresh automatically. Share the pool number with riders who
                  want to join.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
