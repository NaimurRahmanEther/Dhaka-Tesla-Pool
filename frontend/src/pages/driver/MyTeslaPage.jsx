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
import { formatDateTime } from '@/lib/format'
import locationService from '@/services/location.service'
import routeService from '@/services/route.service'
import vehicleService from '@/services/vehicle.service'

export default function MyTeslaPage() {
  const locations = useApi(locationService.getAll, [])
  const vehicle = useApi(vehicleService.getMyVehicle, [])
  const route = useApi(routeService.getMyRoute, [])
  const [model, setModel] = useState('')
  const [capacity, setCapacity] = useState('')
  const [currentLocation, setCurrentLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [notice, setNotice] = useState(null)
  const options = (locations.data ?? []).map((l) => ({ value: String(l.id), label: l.name }))
  const nameFor = (id) => locations.data?.find((l) => l.id === id)?.name
  const noVehicle = vehicle.error?.status === 404
  const online = vehicle.data?.status === 'ONLINE'
  async function register(event) {
    event.preventDefault()
    const next = {}
    if (model.trim().length < 2) next.model = 'Enter at least 2 characters'
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1)
      next.capacity = 'Enter a positive seat capacity'
    if (!currentLocation) next.location = 'Choose your current location'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy('register')
    setError(null)
    try {
      await vehicleService.createVehicle({
        model: model.trim(),
        capacity: Number(capacity),
        currentLocationId: Number(currentLocation),
      })
      vehicle.reload()
      setNotice('Your Tesla is registered. Go online when you’re ready.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }
  async function toggle() {
    setBusy('toggle')
    setError(null)
    setNotice(null)
    try {
      await vehicleService.updateStatus(online ? 'OFFLINE' : 'ONLINE')
      vehicle.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }
  async function plan(event) {
    event.preventDefault()
    if (!destination) {
      setErrors({ destination: 'Choose a destination' })
      return
    }
    setBusy('plan')
    setError(null)
    setErrors({})
    setNotice(null)
    try {
      await routeService.createRoute(Number(destination))
      route.reload()
      setDestination('')
      setNotice('Your planned route has been updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }
  const loading = locations.loading || vehicle.loading
  const loadError = locations.error ?? (!noVehicle ? vehicle.error : null)
  return (
    <>
      <PageHeader
        title="Your Tesla, ready to go."
        description="Set up your car, manage availability, and plan where you’re heading."
        eyebrow="TAKE THE WHEEL"
      />
      {error && (
        <Alert tone="error" className="mt-6">
          {error}
        </Alert>
      )}
      {notice && (
        <Alert tone="success" className="mt-6">
          {notice}
        </Alert>
      )}
      {loading ? (
        <div className="py-20">
          <Spinner label="Loading your Tesla" />
        </div>
      ) : loadError ? (
        <div className="mt-8">
          <Alert tone="error">{loadError.message}</Alert>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              locations.reload()
              vehicle.reload()
            }}
          >
            Try again
          </Button>
        </div>
      ) : !options.length ? (
        <EmptyState
          className="mt-8"
          title="No locations available"
          description="Check back when city stops are available to register your car."
        />
      ) : noVehicle ? (
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card>
            <h2 className="text-xl font-bold text-brand-900">Meet your next shared journey.</h2>
            <p className="mt-2 text-sm text-slate-500">First, tell us a little about your Tesla.</p>
            <form className="mt-7" noValidate onSubmit={register}>
              <fieldset disabled={busy !== null} className="space-y-6">
                <Input
                  label="Vehicle model or name"
                  placeholder="e.g. Tesla Model 3"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  error={errors.model}
                  required
                />
                <Input
                  label="Passenger seat capacity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  hint="The seats available for passengers."
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  error={errors.capacity}
                  required
                />
                <Select
                  label="Current location"
                  placeholder="Where is your Tesla?"
                  options={options}
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  error={errors.location}
                  required
                />
                <Button full type="submit" loading={busy === 'register'}>
                  Register my Tesla <Icon name="arrow" />
                </Button>
              </fieldset>
            </form>
          </Card>
          <div className="rounded-2xl bg-brand-50 p-7">
            <Icon name="car" className="h-8 w-8 text-brand-600" />
            <h2 className="mt-5 text-xl font-bold text-brand-900">Your car. Your schedule.</h2>
            <p className="mt-3 text-sm leading-7 text-brand-700">
              Register once, then go online whenever you’re ready. Choose the requests that suit
              your available seats and route.
            </p>
            <p className="mt-5 border-t border-brand-100 pt-5 text-xs leading-6 text-brand-600">
              Your Tesla starts offline, so you have time to get everything ready.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1fr_1.25fr]">
          <Card>
            <div className="flex items-start justify-between">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Icon name="car" className="h-9 w-9" />
              </span>
              <Badge status={vehicle.data.status} />
            </div>
            <h2 className="mt-6 break-words text-2xl font-bold text-brand-900">
              {vehicle.data.model}
            </h2>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Icon name="users" />
                {vehicle.data.capacity} seats
              </span>
              <span className="flex items-center gap-2">
                <Icon name="pin" />
                {nameFor(vehicle.data.current_location_id)}
              </span>
            </div>
            <div className="mt-7 border-t border-slate-100 pt-6">
              <h3 className="font-semibold text-brand-900">
                {online ? 'You’re available for rides.' : 'You’re taking a break.'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {online
                  ? 'Browse waiting passengers and accept the rides that fit.'
                  : 'Go online when you’re ready to accept passenger requests.'}
              </p>
              <Button
                full
                className="mt-5"
                variant={online ? 'secondary' : 'primary'}
                loading={busy === 'toggle'}
                disabled={busy !== null}
                onClick={toggle}
              >
                {online ? 'Go offline' : 'Go online'}
              </Button>
              {online && (
                <LinkButton to="/requests" className="mt-3 w-full">
                  Find ride requests <Icon name="arrow" />
                </LinkButton>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-brand-900">Where are you heading?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Save a planned route from your current location.
            </p>
            {route.loading ? (
              <div className="py-8">
                <Spinner label="Loading planned route" />
              </div>
            ) : route.error && route.error.status !== 404 ? (
              <Alert className="mt-5" tone="error">
                {route.error.message}
              </Alert>
            ) : route.data ? (
              <div className="my-6 rounded-xl bg-canvas p-5">
                <RouteSummary
                  pickup={nameFor(route.data.start_location_id)}
                  destination={nameFor(route.data.destination_location_id)}
                />
                <p className="mt-5 text-xs text-slate-500">
                  {route.data.route.distance} km · Planned {formatDateTime(route.data.created_at)}
                </p>
              </div>
            ) : (
              <p className="my-6 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
                No route planned yet. Choose your destination below.
              </p>
            )}
            <form className="mt-5" noValidate onSubmit={plan}>
              <fieldset disabled={busy !== null} className="space-y-5">
                <Select
                  label={route.data ? 'New destination' : 'Destination'}
                  placeholder="Choose a destination"
                  options={options.filter(
                    (o) => o.value !== String(vehicle.data.current_location_id),
                  )}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  error={errors.destination}
                  required
                />
                <Button type="submit" loading={busy === 'plan'}>
                  <Icon name="route" />
                  {route.data ? 'Update route' : 'Plan my route'}
                </Button>
              </fieldset>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
