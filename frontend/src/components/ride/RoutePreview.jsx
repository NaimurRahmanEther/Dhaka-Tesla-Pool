import { Alert, Loading } from '@/components/ui'
import useApi from '@/hooks/useApi'
import routeService from '@/services/route.service'
import RoutePath from './RoutePath'

export default function RoutePreview({ start, destination }) {
  const preview = useApi(() => routeService.preview(Number(start), Number(destination)), [start, destination])
  if (preview.loading) return <Loading label="Finding your route…" />
  if (preview.error) return <Alert tone="error">{preview.error.message}</Alert>
  return <RoutePath route={preview.data} title="Route preview · save to confirm" />
}
