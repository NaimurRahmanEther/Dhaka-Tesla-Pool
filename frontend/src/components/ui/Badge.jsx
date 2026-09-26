const statuses = {
  REQUESTED: ['amber', 'Waiting for a driver'],
  MATCHED: ['sky', 'Driver accepted'],
  DRIVER_ARRIVED: ['violet', 'Driver arrived'],
  ONGOING: ['indigo', 'On the way'],
  COMPLETED: ['emerald', 'Completed'],
  CANCELLED: ['rose', 'Cancelled'],
  ONLINE: ['emerald', 'Online'],
  OFFLINE: ['slate', 'Offline'],
  DRIVER: ['sky', 'Driver'],
  PASSENGER: ['teal', 'Passenger'],
  PAID: ['emerald', 'Paid'],
  PENDING: ['amber', 'Pending'],
  FAILED: ['rose', 'Failed'],
  ACTIVE: ['emerald', 'Active'],
}
const tones = {
  slate: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-50 text-amber-800',
  sky: 'bg-sky-50 text-sky-800',
  violet: 'bg-violet-50 text-violet-800',
  indigo: 'bg-indigo-50 text-indigo-800',
  emerald: 'bg-emerald-50 text-emerald-800',
  rose: 'bg-rose-50 text-rose-800',
  teal: 'bg-teal-50 text-teal-800',
}
export default function Badge({ status, tone, children, className = '' }) {
  const [statusTone, label] = statuses[status] ?? ['slate', status]
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-5 ${tones[tone ?? statusTone] ?? tones.slate} ${className}`}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {children ?? label}
    </span>
  )
}
