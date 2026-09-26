import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import RequestCard from '@/components/driver/RequestCard'
import FareBreakdown from '@/components/ride/FareBreakdown'
import { Alert, Button, Card, EmptyState, PageHeader, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import matchingService from '@/services/matching.service'

// The driver's request board. Rides waiting for a driver, enriched with the
// fields the backend already computed for this driver's Tesla, sorted takeable
// first by the backend — the page hands that order straight through.
//
// A 403 here means the driver has no Tesla or is offline: the backend is
// telling us the driver is not visible on the board. That is an onboarding
// state, not an error, so the page explains it in plain language and links to
// the Tesla page.
export default function RequestsPage() {
  const {
    data: requests,
    loading: requestsLoading,
    error: requestsError,
    reload,
  } = useApi(() => matchingService.getOpenRequests(), [])

  // One accept at a time. `acceptingId` is the ride currently in flight; every
  // card's button is disabled while one is running so a double click cannot
  // burn two rides.
  const [acceptingId, setAcceptingId] = useState(null)
  const [acceptResult, setAcceptResult] = useState(null)
  const [acceptError, setAcceptError] = useState(null)

  // The board refreshes itself every 10 seconds so a new rider appears without
  // a manual reload. Skipped while an accept is in flight so the accept
  // response and the refresh cannot interleave. The refs keep the interval
  // reading the latest values without restarting on every render.
  const acceptingRef = useRef(acceptingId)
  useEffect(() => {
    acceptingRef.current = acceptingId
  })

  const reloadRef = useRef(reload)
  useEffect(() => {
    reloadRef.current = reload
  })

  useEffect(() => {
    const timer = setInterval(() => {
      if (!acceptingRef.current) reloadRef.current()
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  async function handleAccept(request) {
    setAcceptingId(request.id)
    setAcceptError(null)

    try {
      const result = await matchingService.acceptRequest(request.id)
      setAcceptResult(result)
      // The accepted ride has left the board; refresh so it disappears and the
      // free-seat counts on the remaining cards stay truthful.
      reload()
    } catch (err) {
      setAcceptError(err)
      // The board may have changed under us (that seat was just taken) — show
      // the fresh state instead of a stale card.
      reload()
    } finally {
      setAcceptingId(null)
    }
  }

  const notOnBoard = requestsError?.status === 403

  return (
    <>
      <PageHeader
        title="Request board"
        description="Riders waiting for a Tesla — accept the ones that fit your route."
      />

      {acceptResult && (
        <Card className="mt-6 border-emerald-200">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Ride #{acceptResult.assignment.ride.id} accepted
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {acceptResult.driver}&apos;s Tesla ·{' '}
                {acceptResult.pooled ? 'joined your active pool' : 'first ride in this pool'}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setAcceptResult(null)}>
              Close
            </Button>
          </div>

          <div className="mt-5 max-w-sm">
            <FareBreakdown breakdown={acceptResult.fareBreakdown} />
          </div>

          <p className="mt-4 text-sm text-slate-600">
            {acceptResult.pooled
              ? 'This rider joined an existing trip in your Tesla — the shared-trip discount is applied.'
              : 'This is the first rider in this pool — full fare for now. A second rider on the same trip earns them the shared-trip discount.'}
          </p>
        </Card>
      )}

      {acceptError && (
        <div className="mt-6">
          <Alert tone="error">{acceptError.message}</Alert>
        </div>
      )}

      {notOnBoard && (
        <div className="mt-8">
          <EmptyState
            title="You are not visible to riders yet"
            description={requestsError.message}
          >
            <Link
              to="/tesla"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Open My Tesla
            </Link>
          </EmptyState>
        </div>
      )}

      {requestsError && !notOnBoard && (
        <div className="mt-8 max-w-md">
          <Alert tone="error">{requestsError.message}</Alert>
          <Button className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {requestsLoading && requests === null && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {!requestsLoading && !notOnBoard && requests && requests.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No open requests"
            description="When a rider requests a trip, it appears here. Keep your Tesla online with free seats to stay on the board."
          />
        </div>
      )}

      {requests && requests.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              accepting={acceptingId === request.id}
              acceptBlocked={acceptingId !== null}
              onAccept={handleAccept}
            />
          ))}
        </div>
      )}
    </>
  )
}