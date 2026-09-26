import HistoryView from '@/components/ride/HistoryView'
import { DRIVER_COLUMNS } from '@/components/ride/HistoryColumns'
import historyService from '@/services/history.service'
export default function HistoryPage() {
  return (
    <HistoryView
      fetcher={historyService.getDriverHistory}
      title="Good journeys, remembered."
      description="Your completed trips, the people you brought along, and their fares."
      columns={DRIVER_COLUMNS}
      emptyTitle="Your first trip is ahead of you"
      emptyDescription="Completed trips will appear here with passenger details and fares."
    />
  )
}
