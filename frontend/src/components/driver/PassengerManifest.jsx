import { Badge } from '@/components/ui'
import { formatTaka } from '@/lib/format'

// Who is in the driver's Tesla right now. The backend computes the seat
// numbers and each rider's fare, so this component only lays them out — it
// never adds seats or recomputes a fare. A rider row comes from
// GET /pool/:poolId/passengers with { rideId, name, pickup, destination,
// seatsAllocated, status, fare }.
export default function PassengerManifest({ manifest }) {
  const { vehicle, occupiedSeats, availableSeats, passengers } = manifest

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Passengers in your Tesla
        </h3>
        <p className="text-xs text-slate-500">
          {occupiedSeats} occupied · {availableSeats} free of {vehicle.capacity}
        </p>
      </div>

      {passengers.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No riders in this pool yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {passengers.map((passenger) => (
            <li key={passenger.rideId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{passenger.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {passenger.pickup} → {passenger.destination}
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {passenger.seatsAllocated} seat{passenger.seatsAllocated > 1 ? 's' : ''}
              </span>
              <Badge status={passenger.status} />
              <span className="w-20 text-right text-sm font-semibold text-slate-900">
                {passenger.fare === null ? '—' : `${formatTaka(passenger.fare)} BDT`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}