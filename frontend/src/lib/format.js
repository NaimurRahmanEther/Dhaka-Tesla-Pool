import { CANCELLABLE_RIDE_STATUSES } from '@/lib/constants'

// Formatting and display helpers. Deliberately no arithmetic here: the fare is
// computed by the backend and stored on the ride, and this file only reshapes
// what the server already sent.

// Money is whole Taka, always an integer from the backend. Render it as such -
// never introduce decimals into the display path.
export function formatTaka(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return String(Math.trunc(amount))
}

// Renders ISO timestamps in a readable local format. A missing value is
// legitimate (a ride still in progress has no completed_at) and renders as '—'.
export function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Whether the backend would still accept a cancel for this status. Mirrors
// CANCELLABLE_RIDE_STATUSES in the backend, so the button only renders when the
// request can actually succeed.
export function canCancelRide(status) {
  return CANCELLABLE_RIDE_STATUSES.includes(status)
}

// Turns the rides.fare_breakdown JSONB the server wrote into renderable rows.
// Reads the values; does not recompute any of them.
export function fareRows(breakdown) {
  if (!breakdown || typeof breakdown !== 'object') return []

  const rows = [
    { label: 'Base fare', amount: breakdown.baseFare },
    { label: 'Distance charge', amount: breakdown.distanceCharge },
  ]

  if (Number(breakdown.poolDiscount) > 0) {
    rows.push({ label: 'Pool discount', amount: breakdown.poolDiscount })
  }

  rows.push({ label: 'You pay', amount: breakdown.fare, total: true })

  return rows
}