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
import RouteSummary from '@/components/ride/RouteSummary'
import useApi from '@/hooks/useApi'
import locationService from '@/services/location.service'
import rideService from '@/services/ride.service'

export default function RequestRidePage() {
  const { data: locations, loading, error, reload } = useApi(locationService.getAll, [])
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [seats, setSeats] = useState('1')
  const [errors, setErrors] = useState({})
  const [backendError, setBackendError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [createdRide, setCreatedRide] = useState(null)
  const options = (locations ?? []).map((l) => ({ value: String(l.id), label: l.name }))
  const nameFor = (id) => (locations ?? []).find((l) => l.id === Number(id))?.name

  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!pickup) next.pickup = 'Choose your pickup point'
    if (!destination) next.destination = 'Choose your destination'
    if (pickup && pickup === destination) next.destination = 'Choose a different destination'
    if (!Number.isInteger(Number(seats)) || Number(seats) < 1)
      next.seats = 'Enter a positive whole number'
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    setBackendError(null)
    try {
      setCreatedRide(
        await rideService.createRide({
          pickupLocationId: Number(pickup),
          destinationLocationId: Number(destination),
          seatsRequested: Number(seats),
        }),
      )
    } catch (err) {
      setBackendError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (createdRide)
    return (
      <>
        <PageHeader
          eyebrow="YOU’RE ON YOUR WAY"
          title="Your request is in."
          description="A driver can now accept your journey. Follow its progress in My rides."
        />
        <Card className="mt-8 max-w-2xl">
          <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon name="check" className="h-7 w-7" />
          </span>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-brand-900">Ride #{createdRide.id}</h2>
            <Badge status={createdRide.status} />
          </div>
          <RouteSummary
            pickup={nameFor(createdRide.pickup_location_id)}
            destination={nameFor(createdRide.destination_location_id)}
          />
          <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500">
            {createdRide.seats_requested} seat(s) requested. Your fare appears when a driver
            accepts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton to={'/my-rides/' + createdRide.id}>
              Follow this ride <Icon name="arrow" />
            </LinkButton>
            <Button
              variant="secondary"
              onClick={() => {
                setCreatedRide(null)
                setPickup('')
                setDestination('')
                setSeats('1')
              }}
            >
              Request another
            </Button>
          </div>
        </Card>
      </>
    )

  return (
    <>
      <PageHeader
        title="Where are we heading?"
        description="Pick your stops. We’ll put your request in front of available drivers."
      />
      {loading ? (
        <div className="py-20">
          <Spinner label="Loading pickup and destination stops" />
        </div>
      ) : error ? (
        <div className="mt-8">
          <Alert tone="error">{error.message}</Alert>
          <Button variant="secondary" className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : !locations?.length ? (
        <EmptyState
          className="mt-8"
          title="No stops available yet"
          description="Check back soon to plan your journey."
        />
      ) : (
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Card>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="route" />
              </span>
              <div>
                <h2 className="font-bold text-brand-900">Plan your ride</h2>
                <p className="mt-0.5 text-xs text-slate-500">A few details, then you’re ready.</p>
              </div>
            </div>
            {backendError && (
              <Alert tone="error" className="mb-5">
                {backendError}
              </Alert>
            )}
            <form noValidate onSubmit={handleSubmit}>
              <fieldset disabled={submitting} className="space-y-6">
                <Select
                  id="request-pickup"
                  label="Where from?"
                  placeholder="Select a pickup point"
                  options={options}
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  error={errors.pickup}
                  required
                />
                <Select
                  id="request-destination"
                  label="Where to?"
                  placeholder="Select your destination"
                  options={options.filter((o) => o.value !== pickup)}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  error={errors.destination}
                  required
                />
                <Input
                  id="request-seats"
                  label="How many seats?"
                  hint="Include yourself and everyone travelling with you."
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  error={errors.seats}
                  required
                />
                <Button type="submit" full loading={submitting}>
                  {submitting ? 'Sending your request…' : 'Request this ride'}
                  {!submitting && <Icon name="arrow" />}
                </Button>
              </fieldset>
            </form>
          </Card>
          <div className="space-y-5">
            <Card>
              <p className="eyebrow mb-6">Your journey at a glance</p>
              <RouteSummary pickup={nameFor(pickup)} destination={nameFor(destination)} />
              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm text-slate-500">
                <Icon name="users" />
                {Number(seats) > 0 ? seats + ' seat(s) requested' : 'Choose your seats'}
              </div>
            </Card>
            <div className="rounded-2xl bg-brand-50 p-6">
              <Icon name="wallet" className="text-brand-600" />
              <h3 className="mt-3 font-semibold text-brand-900">No fare guesswork.</h3>
              <p className="mt-2 text-sm leading-6 text-brand-700">
                Your driver’s acceptance confirms your fare. You’ll see the full breakdown before
                the trip, and pay after you arrive.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
