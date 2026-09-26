import HistoryView from '@/components/ride/HistoryView'
import { PASSENGER_COLUMNS } from '@/components/ride/HistoryColumns'
import historyService from '@/services/history.service'
export default function HistoryPage() {
  return (
    <HistoryView
      fetcher={historyService.getPassengerHistory}
      title="Every journey has a story."
      description="Your rides, from the first request to the final stop."
      columns={PASSENGER_COLUMNS}
      emptyTitle="Your story starts with a ride"
      emptyDescription="Request your first journey and it will appear here, along with its status and fare."
    />
  )
}
