import { CANCELLABLE_RIDE_STATUSES } from '@/lib/constants'

export function formatTaka(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return String(Math.trunc(amount))
}

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

export function canCancelRide(status) {
  return CANCELLABLE_RIDE_STATUSES.includes(status)
}

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