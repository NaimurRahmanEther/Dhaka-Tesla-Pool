import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Icon,
  Input,
  LinkButton,
  PageHeader,
  Spinner,
} from '@/components/ui'
import RouteSummary from '@/components/ride/RouteSummary'
import useApi from '@/hooks/useApi'
import { formatDateTime, formatTaka } from '@/lib/format'
import rideService from '@/services/ride.service'

export default function MyRidesPage() {
  const { data: rides, loading, error, reload } = useApi(rideService.getMyRides, [])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const filtered = (rides ?? []).filter((ride) => {
    const active = !['COMPLETED', 'CANCELLED'].includes(ride.status)
    return (
      (filter === 'all' || (filter === 'active' ? active : !active)) &&
      (ride.id + ' ' + ride.pickup_location + ' ' + ride.destination_location)
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  })
  return (
    <>
      <PageHeader
        title="Your rides, all together."
        description="Keep up with your next journey or look back at where you’ve been."
      >
        <LinkButton to="/request">
          <Icon name="plus" />
          New ride
        </LinkButton>
      </PageHeader>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div
          className="flex rounded-xl border border-slate-200 bg-white p-1"
          aria-label="Filter rides"
        >
          {[
            ['all', 'All rides'],
            ['active', 'In progress'],
            ['past', 'Past rides'],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={
                'min-h-10 rounded-lg px-3 text-xs font-semibold transition sm:px-4 ' +
                (filter === value ? 'bg-brand-800 text-white' : 'text-slate-500 hover:bg-brand-50')
              }
            >
              {label}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" loading={loading} onClick={reload}>
          <Icon name="refresh" className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="mt-5 max-w-md">
        <Input
          label="Find a ride"
          type="search"
          placeholder="Search by stop or ride number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {error && (
        <Alert tone="error" className="mt-6">
          {error.message}
        </Alert>
      )}
      {loading && rides === null ? (
        <div className="py-20">
          <Spinner label="Loading your rides" />
        </div>
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={rides?.length ? 'No rides match this view' : 'Your first journey starts here'}
          description={
            rides?.length
              ? 'Try a different search or filter.'
              : 'Request a seat and your ride will appear here.'
          }
        >
          {rides?.length ? (
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
            >
              Clear filters
            </Button>
          ) : (
            <LinkButton to="/request">
              Request a ride <Icon name="arrow" />
            </LinkButton>
          )}
        </EmptyState>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {filtered.map((ride) => (
            <Link
              key={ride.id}
              to={'/my-rides/' + ride.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-500 hover:shadow-md sm:p-6"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">RIDE #{ride.id}</span>
                <Badge status={ride.status} />
              </div>
              <RouteSummary pickup={ride.pickup_location} destination={ride.destination_location} />
              <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-500">
                    {ride.seats_requested} seat(s) · {formatDateTime(ride.requested_at)}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-900">
                    {ride.fare == null
                      ? 'Fare available after matching'
                      : formatTaka(ride.fare) + ' BDT'}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-brand-700">
                  View ride{' '}
                  <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
