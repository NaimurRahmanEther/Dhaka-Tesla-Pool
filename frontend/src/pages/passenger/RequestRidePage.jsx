import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Alert, Badge, Button, Card, EmptyState, Input, PageHeader, Select, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import { formatDateTime } from '@/lib/format'
import locationService from '@/services/location.service'
import rideService from '@/services/ride.service'

// The core passenger action. Both dropdowns load from GET /location through
// useApi, so the same loading/error/empty handling as any other data page.
//
// Client-side validation mirrors the backend's zod schema (positive integers,
// different locations) so the user finds out before a round trip; the server
// runs the same rules again regardless.
//
// What the server gives back after createRide: the ride row with status
// REQUESTED and fare + fare_breakdown still null — the fare is computed when a
// driver matches the ride, not when it is requested. So the success panel shows
// exactly what exists at this moment and no fare line at all.
export default function RequestRidePage() {
  const {
    data: locations,
    loading: locationsLoading,
    error: locationsError,
    reload: reloadLocations,
  } = useApi(() => locationService.getAll(), [])

  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [seats, setSeats] = useState('')
  const [errors, setErrors] = useState({})
  const [backendError, setBackendError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [createdRide, setCreatedRide] = useState(null)

  const locationOptions = (locations ?? []).map((location) => ({
    value: String(location.id),
    label: location.name,
  }))

  function locationName(id) {
    const location = (locations ?? []).find((item) => item.id === Number(id))
    return location ? location.name : ''
  }

  function resetForm() {
    setPickup('')
    setDestination('')
    setSeats('')
    setErrors({})
    setBackendError(null)
    setCreatedRide(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    const requestedSeats = Number(seats)

    if (!pickup) nextErrors.pickup = 'Choose a pickup point'
    if (!destination) nextErrors.destination = 'Choose a destination'
    if (pickup && destination && pickup === destination) {
      nextErrors.destination = 'Pickup and destination must be different'
    }
    if (!seats || !Number.isInteger(requestedSeats) || requestedSeats < 1) {
      nextErrors.seats = 'Seats must be a positive whole number'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setBackendError(null)

    try {
      // The backend expects JSON numbers, and a <Select> + text input give
      // strings. Number() before sending, or the zod validation rejects the
      // request with a message that does not explain the real cause.
      const ride = await rideService.createRide({
        pickupLocationId: Number(pickup),
        destinationLocationId: Number(destination),
        seatsRequested: requestedSeats,
      })
      setCreatedRide(ride)
    } catch (err) {
      // The backend's message is written to be read by a human, so show it as-is.
      setBackendError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (locationsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (locationsError) {
    return (
      <>
        <PageHeader title="Request a ride" description="The list of places could not be loaded." />
        <div className="mt-8 max-w-md">
          <Alert tone="error">{locationsError.message}</Alert>
          <Button className="mt-4" onClick={reloadLocations}>
            Try again
          </Button>
        </div>
      </>
    )
  }

  if (!locations?.length) {
    return (
      <>
        <PageHeader title="Request a ride" description="Choose where you are and where you are going." />
        <div className="mt-8">
          <EmptyState
            title="No places are available yet"
            description="The city's locations have not been set up. Check back soon."
          />
        </div>
      </>
    )
  }

  if (createdRide) {
    return (
      <>
        <PageHeader title="Ride requested" description="Your request is in the queue." />
        <Card className="mt-8">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-500">Request number</dt>
              <dd className="font-medium text-slate-900">#{createdRide.id}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-500">Route</dt>
              <dd className="font-medium text-slate-900">
                {locationName(createdRide.pickup_location_id)} → {locationName(createdRide.destination_location_id)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-500">Seats</dt>
              <dd className="font-medium text-slate-900">{createdRide.seats_requested}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge status={createdRide.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-500">Requested</dt>
              <dd className="font-medium text-slate-900">{formatDateTime(createdRide.requested_at)}</dd>
            </div>
          </dl>

          <p className="mt-5 text-sm text-slate-500">
            Your fare is calculated the moment a driver accepts your ride — you will see the full breakdown as
            soon as that happens.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={resetForm}>Request another ride</Button>
            <Link
              to="/my-rides"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              View my rides
            </Link>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Request a ride" description="Choose where you are and where you are going." />

      {backendError && (
        <div className="mt-6">
          <Alert tone="error">{backendError}</Alert>
        </div>
      )}

      <Card className="mt-6 max-w-md">
        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <Select
            id="request-pickup"
            label="Pickup point"
            placeholder="Choose where you are"
            options={locationOptions}
            value={pickup}
            onChange={(event) => setPickup(event.target.value)}
            error={errors.pickup}
          />
          <Select
            id="request-destination"
            label="Destination"
            placeholder="Choose where you are going"
            options={locationOptions}
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            error={errors.destination}
          />
          <Input
            id="request-seats"
            label="Seats needed"
            type="number"
            min="1"
            inputMode="numeric"
            value={seats}
            onChange={(event) => setSeats(event.target.value)}
            error={errors.seats}
          />

          <Button type="submit" full loading={submitting}>
            Request ride
          </Button>
        </form>
      </Card>
    </>
  )
}