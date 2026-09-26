import { Badge, Icon } from '@/components/ui'
import { formatTaka } from '@/lib/format'
export default function PassengerManifest({ manifest }) {
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
