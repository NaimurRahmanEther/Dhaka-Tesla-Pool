import { Badge, Button, Card } from '@/components/ui'
import { formatDateTime } from '@/lib/format'

// One open request on the driver's board. The request row already carries the
// location names and the rider's name — the backend joins them. The fields the
// backend computed for this driver's own Tesla are shown as-is: freeSeats,
// detourKm, detourAcceptable, fitsInMyTesla. A request that does not fit
// (bad detour or not enough free seats) shows why and cannot be accepted —
// the backend would reject it anyway.
export default function RequestCard({ request, onAccept, accepting, acceptBlocked }) {
  const takeable = request.detourAcceptable && request.fitsInMyTesla

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{request.passenger_name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            requested {formatDateTime(request.requested_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {takeable ? (
            <Badge tone="emerald">Fits your trip</Badge>
          ) : (
            <>
              {!request.detourAcceptable && <Badge tone="rose">Too far off route</Badge>}
              {!request.fitsInMyTesla && <Badge tone="amber">Not enough free seats</Badge>}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-900">
          {request.pickup_location} → {request.destination_location}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>
          {request.seats_requested} seat{request.seats_requested > 1 ? 's' : ''} wanted
        </span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>
          {request.freeSeats} free seat{request.freeSeats === 1 ? '' : 's'} on your Tesla
        </span>
        {request.detourKm !== null && (
          <>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{request.detourKm === 0 ? 'on your route' : `+${request.detourKm} km detour`}</span>
          </>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          size="sm"
          loading={accepting}
          disabled={!takeable || acceptBlocked}
          onClick={() => onAccept(request)}
        >
          Accept this ride
        </Button>
      </div>
    </Card>
  )
}