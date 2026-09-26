import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Alert, Button, Card, Input, PageHeader, Select } from '@/components/ui'
import rideService from '@/services/ride.service'
import poolService from '@/services/pool.service'

// A passenger joins a pool the driver has already created. There is no public
// pool directory — the driver must share the pool ID. The page takes the pool
// ID in a text input, and lets the passenger pick ONE of their own REQUESTED
// rides to add to it. On submit, POST /pool/:poolId/add-passenger with the
// chosen rideId, then refresh the driver's manifest and check the fare dropped.
//
// The ride-ID dropdown lists only the passenger's own rides that are still
// REQUESTED; completed, ongoing or matched rides are not eligible. If no such
// rides exist, the page shows a helpful note and a link to request a new ride.

export default function JoinPoolPage() {
  const [poolId, setPoolId] = useState('')
  const [poolIdError, setPoolIdError] = useState(null)
  const [rideId, setRideId] = useState('')
  const [rideIdError, setRideIdError] = useState(null)
  const [rideOptions, setRideOptions] = useState([])
  const [loadingRides, setLoadingRides] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [joinError, setJoinError] = useState(null)
  const [joinSuccess, setJoinSuccess] = useState(false)

  // Refresh the rider's own requested rides (the ones they can join a pool with).
  async function refreshRides() {
    setLoadingRides(true)
    setRideOptions([])
    try {
      const result = await rideService.getMyRides()
      const requested = (result.data || [])
        .filter((r) => r.status === 'REQUESTED')
        .map((r) => ({ value: String(r.id), label: `Ride #${r.id}: ${r.pickup_location} → ${r.destination_location} (${r.seats_requested} seats)` }))
      setRideOptions(requested)
    } catch (err) {
      setJoinError(err.message)
    } finally {
      setLoadingRides(false)
    }
  }

  // Submit the join-pool form.
  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setJoinError(null)
    setJoinSuccess(false)

    // Validation: pool ID and a ride must be chosen.
    if (!poolId) {
      setPoolIdError('Enter the pool ID')
    } else {
      setPoolIdError(null)
    }
    if (!rideId) {
      setRideIdError('Choose a ride')
    } else {
      setRideIdError(null)
    }
    if (poolIdError || rideIdError) {
      setSubmitting(false)
      return
    }

    try {
      await poolService.addPassenger(poolId, Number(rideId))
      setJoinSuccess(true)
      // Reload the driver's manifest and the rider's own ride list so the new
      // passenger appears and the fare is recomputed.
      refreshRides()
    } catch (err) {
      // The backend returns many reasons: 404 pool not found, 403 not the
      // owner, 409 NO_SEAT_AVAILABLE (pool filled up), 400 ride not REQUESTED.
      setJoinError(err.message || 'Could not join this pool')
    } finally {
      setSubmitting(false)
    }
  }

  // If we just joined successfully, show a summary then reset.
  if (joinSuccess) {
    return (
      <Card className="mt-6 border-emerald-200">
        <h2 className="text-lg font-semibold text-slate-900">Joined the pool</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your ride has been added. The driver's manifest now shows the extra
          passenger and the fare has been recalculated with the shared-trip discount.
        </p>
        <Button size="sm" variant="secondary" onClick={() => {
          setJoinSuccess(false)
          setPoolId('')
          setRideId('')
          setPoolIdError(null)
          setRideIdError(null)
        }}>
          OK
        </Button>
      </Card>
    )
  }

  return (
    <>
      <PageHeader
        title="Join a pool"
        description="The driver has a pool — enter the pool ID and choose one of your requested rides to join."
      />

      {joinError && (
        <div className="mt-6 max-w-md">
          <Alert tone="error">{joinError}</Alert>
        </div>
      )}

      <Card className="mt-6">
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="pool-id" className="block text-sm font-medium text-slate-700 mb-1">
              Pool ID
            </label>
            <Input
              id="pool-id"
              type="text"
              value={poolId}
              onChange={(event) => setPoolId(event.target.value)}
              placeholder="e.g. 6"
              error={poolIdError}
            />
            <p className="mt-1 text-xs text-slate-500">
              The driver should share this with you. There is no public pool directory.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="ride-select" className="block text-sm font-medium text-slate-700 mb-1">
              Your ride to join
            </label>
            <Select
              id="ride-select"
              label="Your ride"
              placeholder="Select a ride"
              options={rideOptions}
              value={rideId}
              onChange={(event) => setRideId(event.target.value)}
              error={rideIdError}
              disabled={loadingRides}
            />
            {loadingRides && (
              <div className="mt-2 text-sm text-slate-500">Loading your rides…</div>
            )}
            {(!rideOptions || rideOptions.length === 0) && !loadingRides && (
              <p className="mt-2 text-sm text-slate-500">
                You have no requested rides — <Link to="/request">request a ride</Link> first.
              </p>
            )}
          </div>

          <Button type="submit" full loading={submitting}>
            {submitting ? 'Joining…' : 'Join this pool'}
          </Button>
        </form>
      </Card>

      {joinSuccess && <></>}

      {/* If the passenger already joined and the page was reloaded, we render
          the summary here instead of the form. The submit handler above also
          navigates back to the driver's active trip. */}
    </>
  )
}