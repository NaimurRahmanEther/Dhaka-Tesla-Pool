import { RIDE_STATUS, ROLES, VEHICLE_STATUS } from '@/lib/constants'

// Statuses we render map to a colour so the eye can find the state of a ride
// without reading the word. The map keys are the backend strings from
// constants.js - the one piece of shared logic in the kit, and the reason
// constants.js exists. Any unknown status falls back to a neutral grey.
const STATUS_TONES = {
  [RIDE_STATUS.REQUESTED]: 'amber',
  [RIDE_STATUS.MATCHED]: 'sky',
  [RIDE_STATUS.DRIVER_ARRIVED]: 'violet',
  [RIDE_STATUS.ONGOING]: 'indigo',
  [RIDE_STATUS.COMPLETED]: 'emerald',
  [RIDE_STATUS.CANCELLED]: 'rose',
  [VEHICLE_STATUS.ONLINE]: 'emerald',
  [VEHICLE_STATUS.OFFLINE]: 'slate',
  [ROLES.DRIVER]: 'sky',
  [ROLES.PASSENGER]: 'teal',
}

// Full class strings, never built with template parts - Tailwind's compiler can
// only see utilities that appear literally in the source.
const TONE_CLASSES = {
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  sky: 'bg-sky-100 text-sky-800',
  violet: 'bg-violet-100 text-violet-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  rose: 'bg-rose-100 text-rose-800',
  teal: 'bg-teal-100 text-teal-800',
}

// <Badge status={ride.status} /> colours itself and shows the status text.
// Pass children to show a friendlier label, or an explicit `tone` to override.
export default function Badge({ status, tone, children, className = '' }) {
  const resolved = tone ?? STATUS_TONES[status] ?? 'slate'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[resolved]} ${className}`}
    >
      {children ?? status}
    </span>
  )
}