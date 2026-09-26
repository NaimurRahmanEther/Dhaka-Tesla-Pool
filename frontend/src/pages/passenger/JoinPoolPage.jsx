import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Input,
  LinkButton,
  PageHeader,
  Select,
  Spinner,
} from '@/components/ui'
import FareBreakdown from '@/components/ride/FareBreakdown'
import useApi from '@/hooks/useApi'
import rideService from '@/services/ride.service'
import poolService from '@/services/pool.service'

export default function JoinPoolPage() {
  const { data: rides, loading, error, reload } = useApi(rideService.getMyRides, [])
  const [poolId, setPoolId] = useState('')
  const [rideId, setRideId] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [joinError, setJoinError] = useState(null)
  const [result, setResult] = useState(null)
  const options = (rides ?? [])
    .filter((r) => r.status === 'REQUESTED')
    .map((r) => ({
      value: String(r.id),
      label: '#' + r.id + ' · ' + r.pickup_location + ' → ' + r.destination_location,
    }))
  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!Number.isInteger(Number(poolId)) || Number(poolId) < 1)
      next.poolId = 'Enter a valid pool number from your driver'
    if (!options.some((o) => o.value === rideId)) next.rideId = 'Choose one of your waiting rides'
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    setJoinError(null)
    try {
      setResult(await poolService.addPassenger(Number(poolId), Number(rideId)))
    } catch (err) {
      setJoinError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <>
      <PageHeader
        title="There’s room for together."
        description="Join a driver’s existing pool with a ride you’ve already requested."
        eyebrow="SHARE THE JOURNEY"
      />
      {result ? (
        <Card className="mt-8 max-w-xl">
          <Alert tone="success">You’ve joined the pool. Your shared journey is confirmed.</Alert>
          <div className="my-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-900">Ride #{result.ride.id}</h2>
            <Badge status={result.ride.status} />
          </div>
          <FareBreakdown breakdown={result.fareBreakdown} />
          <LinkButton className="mt-6" to={'/my-rides/' + result.ride.id}>
            View your ride <Icon name="arrow" />
          </LinkButton>
        </Card>
      ) : (
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card>
            <h2 className="text-lg font-bold text-brand-900">Join an existing pool</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ask your driver for their pool number, then select the ride you want to share.
            </p>
            {joinError && (
              <Alert className="mt-5" tone="error">
                {joinError}
              </Alert>
            )}
            {loading ? (
              <div className="py-12">
                <Spinner label="Loading your waiting rides" />
              </div>
            ) : error ? (
              <div className="mt-6">
                <Alert tone="error">{error.message}</Alert>
                <Button className="mt-3" variant="secondary" onClick={reload}>
                  Try again
                </Button>
              </div>
            ) : !options.length ? (
              <EmptyState
                className="mt-6"
                title="You’ll need a waiting ride"
                description="Request your pickup and destination first. A ride that already has a driver cannot join another pool."
              >
                <LinkButton to="/request">
                  Request a ride <Icon name="arrow" />
                </LinkButton>
              </EmptyState>
            ) : (
              <form className="mt-6" noValidate onSubmit={handleSubmit}>
                <fieldset disabled={submitting} className="space-y-6">
                  <Input
                    label="Pool number"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    placeholder="Enter the number from your driver"
                    value={poolId}
                    onChange={(e) => setPoolId(e.target.value)}
                    error={errors.poolId}
                    required
                  />
                  <Select
                    label="Your waiting ride"
                    placeholder="Choose a ride"
                    options={options}
                    value={rideId}
                    onChange={(e) => setRideId(e.target.value)}
                    error={errors.rideId}
                    required
                  />
                  <Button type="submit" full loading={submitting}>
                    Join this pool <Icon name="users" />
                  </Button>
                </fieldset>
              </form>
            )}
          </Card>
          <div className="rounded-2xl bg-brand-50 p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600">
              <Icon name="users" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-brand-900">
              Same direction. Shared journey.
            </h2>
            <ol className="mt-5 space-y-5">
              {[
                'Request a ride with your pickup and destination.',
                'Get the active pool number from your driver.',
                'Join the pool and see your fare breakdown.',
              ].map((text, i) => (
                <li key={text} className="flex gap-3 text-sm leading-6 text-brand-800">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-brand-100 pt-5 text-xs leading-6 text-brand-600">
              Joining depends on available seats and whether your stops fit the route.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
