import HistoryTable from '@/components/ride/HistoryTable'
import { DRIVER_COLUMNS } from '@/components/ride/HistoryColumns.jsx'
import { EmptyState, PageHeader, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import historyService from '@/services/history.service'

// Driver trip history. Lists completed pools with each passenger's ride,
// the Tesla model, seats allocated, and fare.
export default function HistoryPage() {
  const { data, loading, error, reload } = useApi(() => historyService.getDriverHistory(), [])

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
        <PageHeader title="Trip history" description="Your completed trips and passenger fares." />
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
      <PageHeader title="Trip history" description="Your completed trips and passenger fares." />

      {data && data.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No completed trips"
          description="When you finish a trip, the pool and its passengers will appear here with fares."
        />
      ) : (
        <HistoryTable rides={data} columns={DRIVER_COLUMNS} />
      )}
    </>
  )
}