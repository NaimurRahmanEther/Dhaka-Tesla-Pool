import { useState } from 'react'
import HistoryTable from '@/components/ride/HistoryTable'
import { Alert, Button, EmptyState, Icon, Input, PageHeader, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'

export default function HistoryView({
  fetcher,
  title,
  description,
  columns,
  emptyTitle,
  emptyDescription,
}) {
  const { data, loading, error, reload } = useApi(fetcher, [])
  const [query, setQuery] = useState('')
  const filtered = (data ?? []).filter((r) =>
    [
      r.ride_id,
      r.pool_id,
      r.pickup_location,
      r.destination_location,
      r.passenger_name,
      r.model,
      r.status,
    ]
      .filter((v) => v != null)
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  return (
    <>
      <PageHeader title={title} description={description} eyebrow="THE ROADS YOU’VE TAKEN">
        <Button variant="secondary" size="sm" loading={loading} onClick={reload}>
          <Icon name="refresh" className="h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>
      <Input
        className="mt-8 max-w-md"
        label="Find a journey"
        type="search"
        placeholder="Search stops, ride numbers, or status…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error ? (
        <Alert tone="error" className="mt-6">
          {error.message}
        </Alert>
      ) : loading && data === null ? (
        <div className="py-20">
          <Spinner label="Loading journey history" />
        </div>
      ) : !filtered.length ? (
        <EmptyState
          className="mt-6"
          icon="clock"
          title={data?.length ? 'No journeys match your search' : emptyTitle}
          description={
            data?.length ? 'Try searching for a different stop or ride number.' : emptyDescription
          }
        >
          {query && (
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="mt-6">
          <HistoryTable rides={filtered} columns={columns} />
        </div>
      )}
    </>
  )
}
