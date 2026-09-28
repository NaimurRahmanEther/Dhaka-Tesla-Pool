import CancelAction from '@/components/ui/CancelAction'
import { useState } from 'react'
import { Badge, Button, Icon } from '@/components/ui'
import { formatTaka } from '@/lib/format'
export default function PassengerManifest({ manifest, onAction, busy = null }) {
  const [confirmRide, setConfirmRide] = useState(null)
  const { vehicle, occupiedSeats, availableSeats, passengers } = manifest
  return (
    <div>
      <h2 className="text-lg font-bold text-brand-900">Your travel company</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-brand-50 p-4">
          <p className="text-2xl font-bold text-brand-800">
            {occupiedSeats}
            <span className="text-sm font-normal text-brand-500"> / {vehicle.capacity}</span>
          </p>
          <p className="mt-1 text-xs text-brand-600">Seats occupied</p>
        </div>
        <div className="rounded-xl bg-canvas p-4">
          <p className="text-2xl font-bold text-brand-800">{availableSeats}</p>
          <p className="mt-1 text-xs text-slate-500">Seats available</p>
        </div>
      </div>
      {!passengers.length ? (
        <p className="mt-6 text-sm text-slate-500">No passengers in this pool yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {passengers.map((passenger) => (
            <li key={passenger.rideId} className="py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon name="user" className="h-4 w-4 text-brand-500" />
                  <p className="text-sm font-semibold text-brand-900">{passenger.name}</p>
                </div>
                <Badge status={passenger.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {passenger.pickup} → {passenger.destination}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {passenger.seatsAllocated} seat(s) · Ride #{passenger.rideId}
                </span>
                <span className="font-bold text-brand-700">
                  {passenger.fare == null ? 'Fare pending' : formatTaka(passenger.fare) + ' BDT'}
                </span>
              </div>
              {onAction && passenger.status === 'MATCHED' && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" disabled={busy !== null} loading={busy === `arrive-${passenger.rideId}`} onClick={() => onAction(passenger.rideId, 'arrive')}>
                    Arrived at pickup
                  </Button>
                  <CancelAction
                    confirming={confirmRide === passenger.rideId}
                    onOpen={() => setConfirmRide(passenger.rideId)}
                    onKeep={() => setConfirmRide(null)}
                    onConfirm={() => onAction(passenger.rideId, 'cancel')}
                    busy={busy === `cancel-${passenger.rideId}`}
                    disabled={busy !== null}
                    label="Cancel passenger ride"
                    title={`Cancel ${passenger.name}'s ride?`}
                    description="Only this passenger's ride will be cancelled. Other passengers will continue their journey."
                    keepLabel="Keep passenger"
                    confirmLabel="Yes, cancel this ride"
                  />
                </div>
              )}
              {onAction && passenger.status === 'DRIVER_ARRIVED' && (
                <Button className="mt-4" size="sm" disabled={busy !== null} loading={busy === `start-${passenger.rideId}`} onClick={() => onAction(passenger.rideId, 'start')}>
                  Passenger on board
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
