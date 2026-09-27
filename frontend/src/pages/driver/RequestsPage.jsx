import { useState } from 'react'
import RequestCard from '@/components/driver/RequestCard'
import FareBreakdown from '@/components/ride/FareBreakdown'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Icon,
  Input,
  LinkButton,
  PageHeader,
  Spinner,
} from '@/components/ui'
import useApi from '@/hooks/useApi'
import usePolling from '@/hooks/usePolling'
import matchingService from '@/services/matching.service'

export default function RequestsPage() {
  const requests = useApi(matchingService.getOpenRequests, [])
  const [accepting, setAccepting] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [fitsOnly, setFitsOnly] = useState(false)
  usePolling(requests.reload, !accepting && !requests.error, 10000)
  const filtered = (requests.data ?? []).filter(
    (r) =>
      (!fitsOnly || (r.fitsInMyTesla && r.detourAcceptable)) &&
      (r.passenger_name + ' ' + r.pickup_location + ' ' + r.destination_location)
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  async function accept(request) {
    setAccepting(request.id)
    setError(null)
    try {
      setResult(await matchingService.acceptRequest(request.id))
      requests.reload()
    } catch (err) {
      setError(err.message)
      requests.reload()
    } finally {
      setAccepting(null)
    }
  }
  return (
    <>
      <PageHeader
        title="Find your next shared journey."
        description="Passenger requests, ordered by how well they fit your Tesla."
        eyebrow="RIDE REQUESTS"
      >
        <Button
          variant="secondary"
          size="sm"
          loading={requests.loading}
          disabled={accepting !== null}
          onClick={requests.reload}
        >
          <Icon name="refresh" className="h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>
      {result && (
        <Card className="mt-7 border-brand-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">YOU’RE MATCHED</p>
              <h2 className="mt-2 text-xl font-bold text-brand-900">
                Ride #{result.assignment.ride.id} is coming along.
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {result.pooled
                  ? 'This passenger joined your existing pool.'
                  : 'Your new pool is ready.'}
              </p>
            </div>
            <button
              aria-label="Dismiss accepted ride summary"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100"
              onClick={() => setResult(null)}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="mt-5 max-w-md">
            <FareBreakdown breakdown={result.fareBreakdown} />
          </div>
          <LinkButton to="/active-trip" className="mt-5">
            Open active trip <Icon name="arrow" />
          </LinkButton>
        </Card>
      )}
      {error && (
        <Alert tone="error" className="mt-6">
          {error}
        </Alert>
      )}
      {requests.error?.status === 403 ? (
        <EmptyState
          className="mt-8"
          icon="car"
          title="Let’s get you ready to drive"
          description={requests.error.message}
        >
          <LinkButton to="/tesla">
            Set up My Tesla <Icon name="arrow" />
          </LinkButton>
        </EmptyState>
      ) : requests.error ? (
        <div className="mt-8">
          <Alert tone="error">{requests.error.message}</Alert>
          <Button className="mt-4" onClick={requests.reload}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <Input
              className="w-full sm:max-w-sm"
              label="Find a request"
              type="search"
              placeholder="Search passengers or stops…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={fitsOnly}
                onChange={(e) => setFitsOnly(e.target.checked)}
                className="h-4 w-4 accent-brand-700"
              />
              Only rides that fit
            </label>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Icon name="refresh" className="h-3 w-3" />
            Refreshes automatically while you’re here.
          </p>
          {requests.loading && requests.data === null ? (
            <div className="py-16">
              <Spinner label="Loading passenger requests" />
            </div>
          ) : !filtered.length ? (
            <EmptyState
              className="mt-6"
              icon="users"
              title={requests.data?.length ? 'No matching requests' : 'A quiet moment on the road'}
              description={
                requests.data?.length
                  ? 'Try another search or turn off the fit filter.'
                  : 'New passenger requests will appear here. Keep your Tesla online when you’re ready.'
              }
            >
              {requests.data?.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('')
                    setFitsOnly(false)
                  }}
                >
                  Clear filters
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {filtered.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  accepting={accepting === request.id}
                  acceptBlocked={accepting !== null}
                  onAccept={accept}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
