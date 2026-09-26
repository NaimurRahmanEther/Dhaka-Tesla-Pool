import { useState } from 'react'

import { Alert, Badge, Button, Card, Input, PageHeader, Select, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import { formatDateTime } from '@/lib/format'
import { VEHICLE_STATUS } from '@/lib/constants'
import locationService from '@/services/location.service'
import routeService from '@/services/route.service'
import vehicleService from '@/services/vehicle.service'

// Everything a driver must sort out before they can serve rides: register the
// Tesla, decide whether they are ONLINE, and plan the destination they are
// heading to.
//
// The 404s are the interesting part. GET /vehicle/me and GET /driver-routes/me
// both return 404 when there is nothing yet — the page shows a form for each
// instead of an error banner.
export default function MyTeslaPage() {
  const {
    data: locations,
    loading: locationsLoading,
    error: locationsError,
    reload: reloadLocations,
  } = useApi(() => locationService.getAll(), [])

  const {
    data: vehicle,
    loading: vehicleLoading,
    error: vehicleError,
    reload: reloadVehicle,
  } = useApi(() => vehicleService.getMyVehicle(), [])

  const {
    data: route,
    loading: routeLoading,
    error: routeError,
    reload: reloadRoute,
  } = useApi(() => routeService.getMyRoute(), [])

  // Registration form
  const [model, setModel] = useState('')
  const [capacity, setCapacity] = useState('')
  const [currentLocation, setCurrentLocation] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [registering, setRegistering] = useState(false)

  // Destination planning
  const [destination, setDestination] = useState('')
  const [destinationError, setDestinationError] = useState(null)
  const [planning, setPlanning] = useState(false)
  const [planningVisible, setPlanningVisible] = useState(false)

  // Status toggle
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState(null)

  const noVehicle = vehicleError?.status === 404
  const noRoute = routeError?.status === 404

  const isOnline = vehicle?.status === VEHICLE_STATUS.ONLINE

  const locationOptions = (locations ?? []).map((location) => ({
    value: String(location.id),
    label: location.name,
  }))

  function locationName(id) {
    const location = (locations ?? []).find((item) => item.id === Number(id))
    return location ? location.name : ''
  }

  function vehicleErrorBanner() {
    return (
      <>
        <div className="mt-8 max-w-md">
          <Alert tone="error">{vehicleError.message}</Alert>
          <Button className="mt-4" onClick={reloadVehicle}>
            Try again
          </Button>
        </div>
      </>
    )
  }

  async function handleRegister(event) {
    event.preventDefault()

    const nextErrors = {}
    const requestedCapacity = Number(capacity)

    if (model.trim().length < 2) nextErrors.model = 'Vehicle model required'
    if (!capacity || !Number.isInteger(requestedCapacity) || requestedCapacity < 1) {
      nextErrors.capacity = 'Capacity must be a positive whole number'
    }
    if (!currentLocation) nextErrors.currentLocation = "Choose the Tesla's current location"

    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setRegistering(true)
    setFormError(null)

    try {
      // model is a string; capacity and currentLocationId must be JSON numbers.
      await vehicleService.createVehicle({
        model: model.trim(),
        capacity: requestedCapacity,
        currentLocationId: Number(currentLocation),
      })
      setModel('')
      setCapacity('')
      setCurrentLocation('')
      reloadVehicle()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setRegistering(false)
    }
  }

  async function handleToggle() {
    if (!vehicle) return

    setToggling(true)
    setToggleError(null)

    try {
      await vehicleService.updateStatus(
        isOnline ? VEHICLE_STATUS.OFFLINE : VEHICLE_STATUS.ONLINE,
      )
      reloadVehicle()
    } catch (err) {
      setToggleError(err.message)
    } finally {
      setToggling(false)
    }
  }

  async function handlePlanDestination(event) {
    event.preventDefault()

    if (!destination) {
      setDestinationError('Choose a destination')
      return
    }
    setDestinationError(null)

    setPlanning(true)

    try {
      await routeService.createRoute(Number(destination))
      setDestination('')
      setPlanningVisible(false)
      reloadRoute()
    } catch (err) {
      setDestinationError(err.message)
    } finally {
      setPlanning(false)
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
        <PageHeader title="My Tesla" description="Register your car, go online and plan your route." />
        <div className="mt-8 max-w-md">
          <Alert tone="error">{locationsError.message}</Alert>
          <Button className="mt-4" onClick={reloadLocations}>
            Try again
          </Button>
        </div>
      </>
    )
  }

  if (vehicleLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  // No Tesla yet — the 404 is the empty state the phase plan calls out.
  if (noVehicle) {
    return (
      <>
        <PageHeader title="My Tesla" description="Register your car, go online and plan your route." />

        {formError && (
          <div className="mt-6">
            <Alert tone="error">{formError}</Alert>
          </div>
        )}

        <Card className="mt-6 max-w-md">
          <form className="space-y-5" noValidate onSubmit={handleRegister}>
            <Input
              id="tesla-model"
              label="Model"
              placeholder="e.g. Tesla Model 3"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              error={formErrors.model}
            />
            <Input
              id="tesla-capacity"
              label="Seat capacity"
              type="number"
              min="1"
              inputMode="numeric"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              error={formErrors.capacity}
            />
            <Select
              id="tesla-location"
              label="Current location"
              placeholder="Where is the Tesla now?"
              options={locationOptions}
              value={currentLocation}
              onChange={(event) => setCurrentLocation(event.target.value)}
              error={formErrors.currentLocation}
            />

            <Button type="submit" full loading={registering}>
              Register my Tesla
            </Button>
          </form>
        </Card>
      </>
    )
  }

  if (vehicleError) return vehicleErrorBanner()

  const plannedDestinationOptions = locationOptions.filter(
    (option) => option.value !== String(vehicle.current_location_id),
  )

  return (
    <>
      <PageHeader title="My Tesla" description="Register your car, go online and plan your route." />

      {toggleError && (
        <div className="mt-6">
          <Alert tone="error">{toggleError}</Alert>
        </div>
      )}

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{vehicle.model}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {vehicle.capacity} seats · currently in {locationName(vehicle.current_location_id)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={vehicle.status} />
            <Button variant={isOnline ? 'secondary' : 'primary'} loading={toggling} onClick={handleToggle}>
              {isOnline ? 'Go offline' : 'Go online'}
            </Button>
          </div>
        </div>

        {!isOnline && (
          <div className="mt-6">
            <Alert tone="info">
              When you go online, riders see you as available.
              {route
                ? null
                : ' You have not planned a destination yet — matching works best when you have planned where you are heading.'}
            </Alert>
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-6">
          {routeLoading && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}

          {route && !routeLoading && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Planned destination</h3>
                  <p className="mt-1.5 text-sm font-medium text-slate-900">
                    {locationName(route.start_location_id)} → {locationName(route.destination_location_id)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {route.route.distance} km · planned {formatDateTime(route.created_at)}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setPlanningVisible(true)}>
                  Change destination
                </Button>
              </div>
            </div>
          )}

          {(noRoute || planningVisible) && !routeLoading && (
            <div className={route ? 'mt-6' : ''}>
              <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
                {noRoute ? 'Plan your destination' : 'Change destination'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Decide where you are driving so requests that fit your route can be suggested.
              </p>
              {destinationError && (
                <div className="mt-3">
                  <Alert tone="error">{destinationError}</Alert>
                </div>
              )}
              <form className="mt-4 flex flex-wrap items-end gap-3" noValidate onSubmit={handlePlanDestination}>
                <Select
                  id="route-destination"
                  label="Destination"
                  placeholder="Where are you driving?"
                  options={plannedDestinationOptions}
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  className="w-full max-w-xs"
                />
                <Button type="submit" loading={planning}>
                  Plan route
                </Button>
              </form>
            </div>
          )}

          {routeError && routeError.status !== 404 && (
            <Alert tone="error">{routeError.message}</Alert>
          )}
        </div>
      </Card>
    </>
  )
}