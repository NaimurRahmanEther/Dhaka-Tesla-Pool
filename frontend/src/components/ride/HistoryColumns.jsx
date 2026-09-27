import { formatDateTime, formatTaka } from '@/lib/format'
import { Badge } from '@/components/ui'

// Passenger columns: ride_id, status, fare, requested_at, completed_at, pickup, destination
export const PASSENGER_COLUMNS = [
  {
    key: 'ride_id',
    label: 'Ride',
    render: (ride) => `#${ride.ride_id}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (ride) => <Badge status={ride.status} />,
  },
  {
    key: 'fare',
    label: 'Fare',
    align: 'text-right',
    render: (ride) => (ride.fare === null ? '—' : `${formatTaka(ride.fare)} BDT`),
  },
  {
    key: 'requested_at',
    label: 'Requested',
    render: (ride) => formatDateTime(ride.requested_at),
  },
  {
    key: 'completed_at',
    label: 'Completed',
    render: (ride) => formatDateTime(ride.completed_at),
  },
  {
    key: 'pickup_location',
    label: 'Pickup',
    render: (ride) => ride.pickup_location,
  },
  {
    key: 'destination_location',
    label: 'Destination',
    render: (ride) => ride.destination_location,
  },
]

// Driver columns: pool_id, model, ride_id, status, fare, passenger, seats, pickup, destination, completed
export const DRIVER_COLUMNS = [
  {
    key: 'pool_id',
    label: 'Pool',
    render: (ride) => `#${ride.pool_id}`,
  },
  {
    key: 'model',
    label: 'Tesla',
    render: (ride) => ride.model,
  },
  {
    key: 'ride_id',
    label: 'Ride',
    render: (ride) => `#${ride.ride_id}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (ride) => <Badge status={ride.status} />,
  },
  {
    key: 'fare',
    label: 'Fare',
    align: 'text-right',
    render: (ride) => (ride.fare === null ? '—' : `${formatTaka(ride.fare)} BDT`),
  },
  {
    key: 'passenger_name',
    label: 'Passenger',
    render: (ride) => ride.passenger_name,
  },
  {
    key: 'seats_allocated',
    label: 'Seats',
    align: 'text-center',
    render: (ride) => ride.seats_allocated,
  },
  {
    key: 'pickup_location',
    label: 'Pickup',
    render: (ride) => ride.pickup_location,
  },
  {
    key: 'destination_location',
    label: 'Destination',
    render: (ride) => ride.destination_location,
  },
  {
    key: 'completed_at',
    label: 'Completed',
    render: (ride) => formatDateTime(ride.completed_at || ride.ride_completed_at),
  },
]