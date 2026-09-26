import HistoryTable from '@/components/ride/HistoryTable'
import { PASSENGER_COLUMNS } from '@/components/ride/HistoryColumns.jsx'
import { EmptyState, PageHeader, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import historyService from '@/services/history.service'

// Passenger ride history. Lists all rides (including cancelled, in-progress,
// completed) with status, fare, dates, and pickup/destination.
export default function HistoryPage() {
  const { data, loading, error, reload } = useApi(() => historyService.getPassengerHistory(), [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="Ride history" description="All your rides, past and present." />
        <div className="mt-8 max-w-md">
          <EmptyState title="Could not load history" description={error.message}>
            <button className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white" onClick={reload}>
              Try again
            </button>
          </EmptyState>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Ride history" description="All your rides, past and present." />

      {data && data.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No rides yet"
          description="When you request a ride, it will appear here with its status, fare, and timeline."
        />
      ) : (
        <HistoryTable rides={data} columns={PASSENGER_COLUMNS} />
      )}
    </>
  )
}