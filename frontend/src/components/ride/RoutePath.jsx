import { Alert, Loading } from '@/components/ui'
import useApi from '@/hooks/useApi'
import locationService from '@/services/location.service'

export default function RoutePath({ route, title = 'Planned route' }) {
  const locations = useApi(locationService.getAll, [])
  if (!route?.path?.length) return <p className="text-sm text-slate-500">Your route will appear once a driver accepts your ride.</p>
  if (locations.loading) return <Loading label="Loading route stops…" />
  if (locations.error) return <Alert tone="error">{locations.error.message}</Alert>
  return (
    <section aria-label={title} className="rounded-xl border border-brand-100 bg-brand-50 p-5">
      <p className="text-sm font-semibold text-brand-900">{title}</p>
      <ol className="mt-4 space-y-3">
        {route.path.map((id, index) => (
          <li key={`${index}-${id}`} className="flex items-center gap-3 text-sm text-brand-800">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-800 text-xs text-white">{index + 1}</span>
            <span>{locations.data?.find((place) => place.id === Number(id))?.name ?? `Stop ${id}`}</span>
            {index === 0 && <span className="text-xs text-brand-600">Start</span>}
            {index === route.path.length - 1 && <span className="text-xs text-brand-600">Finish</span>}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-brand-700">{Number(route.distance).toFixed(1)} km · Stops shown in travel order</p>
    </section>
  )
}
