import CancelAction from '@/components/ui/CancelAction'
import { useState } from 'react'
import PassengerManifest from '@/components/driver/PassengerManifest'
import RoutePath from '@/components/ride/RoutePath'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  LinkButton,
  PageHeader,
  Loading,
} from '@/components/ui'
import useApi from '@/hooks/useApi'
import usePolling from '@/hooks/usePolling'
import poolService from '@/services/pool.service'
import tripService from '@/services/trip.service'

const calls = {
  cancel: tripService.cancel,
  complete: tripService.complete,
}

export default function ActiveTripPage() {
  const trip = useApi(tripService.getMyActiveTrip, [])
  const [busy, setBusy] = useState(null)
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [ended, setEnded] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const rows = trip.data ?? []
  const poolId = rows[0]?.pool_id
  const manifest = useApi(
    () => (poolId ? poolService.getPoolPassengers(poolId) : Promise.resolve(null)),
    [poolId],
  )
  const passengers = rows.filter((row) => row.ride_id && !['CANCELLED', 'COMPLETED'].includes(row.ride_status))
  const canComplete = passengers.length > 0 && passengers.every((row) => row.ride_status === 'ONGOING')
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
      setCancelled(key === 'cancel')
      setEnded(true)
      setConfirm(false)
      refresh()
    } catch (err) {
      setError(err.message)
      refresh()
    } finally {
      setBusy(null)
    }
  }
  async function passengerAction(rideId, action) {
    setBusy(action + '-' + rideId)
    setError(null)
    setNotice(null)
    try {
      await tripService.updatePassenger(poolId, rideId, action)
      setNotice(action === 'cancel' ? 'This passenger?s ride was cancelled. Other rides are unchanged.' : 'Passenger ride updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
      refresh()
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
          <h2 className="mt-5 text-2xl font-bold text-brand-900">{cancelled ? 'Trip cancelled.' : 'Another journey, well shared.'}</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
            {cancelled ? 'The empty pool is closed. You can accept a new trip.' : 'Your trip is complete. Passengers can now pay their fares from the Payments page.'}
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
          <Loading label="Loading active trip" />
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
                  <p className="mt-1 text-sm text-slate-500">{passengers.length} ride(s) in this trip</p>
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
              {rows[0]?.current_route && <div className="mb-5"><RoutePath route={rows[0].current_route} title="Shared trip route" /></div>}
              <p className="text-sm leading-6 text-slate-500">
                Mark arrival and pickup for each passenger in the passenger list. Cancelling a waiting passenger leaves other rides unchanged.
              </p>
              {canComplete && (
                <div className="mt-5">
                  {confirm && <p className="mb-3 text-sm text-brand-800">Have all passengers reached their destination?</p>}
                  <Button loading={busy === 'complete'} disabled={busy !== null} onClick={() => confirm ? act('complete') : setConfirm(true)}>
                    {confirm ? 'Yes, complete trip' : 'Complete trip'}
                  </Button>
                  {confirm && <Button variant="secondary" className="ml-2" disabled={busy !== null} onClick={() => setConfirm(false)}>Keep trip open</Button>}
                </div>
              )}
              {!passengers.length && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-sm leading-6 text-slate-500">No passengers remain. Close this trip when you are ready to plan your next journey.</p>
                  <CancelAction
                    confirming={confirmCancel}
                    onOpen={() => setConfirmCancel(true)}
                    onKeep={() => setConfirmCancel(false)}
                    onConfirm={() => act('cancel')}
                    busy={busy === 'cancel'}
                    disabled={busy !== null}
                    label="Cancel empty trip"
                    title="Close this empty trip?"
                    description="No passenger rides will be affected. You can choose a new location and destination afterward."
                    keepLabel="Keep trip open"
                    confirmLabel="Yes, close trip"
                  />
                </div>
              )}
            </Card>
            <Card>
              {manifest.error ? (
                <Alert tone="error">{manifest.error.message}</Alert>
              ) : manifest.data ? (
                <PassengerManifest manifest={manifest.data} onAction={passengerAction} busy={busy} />
              ) : (
                <Loading label="Loading passenger manifest" />
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
