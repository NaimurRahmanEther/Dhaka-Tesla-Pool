import { Alert, Button, Icon, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import locationService from '@/services/location.service'

export default function TripRoute({ route }) {
  const locations = useApi(locationService.getAll, [])
  if (!route?.path?.length)
    return <p className="text-sm text-slate-500">The trip route will appear after matching.</p>
  if (locations.loading) return <Spinner label="Loading route locations" />
  if (locations.error)
    return (
      <div>
        <Alert tone="error">{locations.error.message}</Alert>
        <Button variant="secondary" className="mt-3" onClick={() => locations.reload()}>
          Try again
        </Button>
      </div>
    )
  const names = new Map((locations.data ?? []).map((location) => [location.id, location.name]))
  return (
    <div>
      <ol aria-label="Planned trip route">
        {route.path.map((id, index) => (
          <li key={`${index}-${id}`} className="relative flex gap-4 pb-5 last:pb-0">
            {index < route.path.length - 1 && (
              <span aria-hidden="true" className="absolute top-7 left-3.5 h-full w-px bg-brand-100" />
            )}
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-brand-900">
                {names.get(id) ?? `Location #${id}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {index === 0 ? 'Starting location' : index === route.path.length - 1 ? 'Final destination' : 'Along the route'}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {Number.isFinite(route.distance) && (
        <p className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <Icon name="route" className="h-4 w-4" />
          {Number(route.distance.toFixed(2))} km total planned distance
        </p>
      )}
    </div>
  )
}
