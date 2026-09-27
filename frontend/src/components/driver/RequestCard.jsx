import { Badge, Button, Card, Icon } from '@/components/ui'
import RouteSummary from '@/components/ride/RouteSummary'
import TripRoute from '@/components/ride/TripRoute'
import { formatDateTime } from '@/lib/format'

export default function RequestCard({ request, onAccept, accepting, acceptBlocked }) {
  const takeable = request.detourAcceptable && request.fitsInMyTesla
  const canChangeRoute = request.canChangeRoute && request.fitsInMyTesla
  return (
    <Card className="flex flex-col">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
            {request.passenger_name?.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-900">{request.passenger_name}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {formatDateTime(request.requested_at)}
            </p>
          </div>
        </div>
        {takeable && <Badge tone="emerald">Fits your trip</Badge>}
      </div>
      <RouteSummary pickup={request.pickup_location} destination={request.destination_location} />
      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {request.seats_requested} seat(s) requested
        </span>
        <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {request.freeSeats} seats available
        </span>
        {request.detourKm !== null && (
          <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {request.detourKm === 0 ? 'No extra detour' : '+' + request.detourKm + ' km detour'}
          </span>
        )}
      </div>
      {!takeable && (
        <p className="mt-4 text-xs leading-5 text-amber-800">
          {!request.fitsInMyTesla ? 'You don’t have enough available seats for this request. ' : ''}
          {!request.detourAcceptable
            ? 'These stops add too much distance to your current route.'
            : ''}
        </p>
      )}
      <div className="mt-auto pt-6">
        {canChangeRoute && !takeable ? (
          <>
            <div className="mb-5 rounded-xl bg-brand-50 p-4">
              <h3 className="text-sm font-semibold text-brand-900">Start with a different route</h3>
              <p className="mt-2 mb-4 text-xs leading-5 text-brand-700">
                You have no passengers yet. Accepting this request replaces your planned destination with {request.destination_location}.
                Later passengers must fit this new route.
              </p>
              <TripRoute route={request.replacementRoute} />
            </div>
            <Button
              full
              loading={accepting}
              disabled={acceptBlocked}
              onClick={() => onAccept(request, { changeRoute: true })}
            >
              Change route and accept <Icon name="route" />
            </Button>
          </>
        ) : (
          <Button
            full
            loading={accepting}
            disabled={!takeable || acceptBlocked}
            onClick={() => onAccept(request)}
          >
            {accepting ? 'Accepting ride…' : 'Accept this ride'}
            {!accepting && <Icon name="arrow" />}
          </Button>
        )}
      </div>
    </Card>
  )
}
