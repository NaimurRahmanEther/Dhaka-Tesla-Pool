// Enum vocabulary only - the literal strings the backend speaks. These are a
// contract, not data: the frontend has to know them to render a status badge or
// send "PASSENGER" back to POST /auth/register. Anything that describes the
// state of the world (fares, seats, detours) comes from the API instead - see
// section 5a of FRONTEND_BUILD_NOTES.md.

export const ROLES = Object.freeze({
  PASSENGER: 'PASSENGER',
  DRIVER: 'DRIVER',
})

// Forward-only lifecycle. Cancelling is only allowed from REQUESTED or MATCHED.
export const RIDE_STATUS = Object.freeze({
  REQUESTED: 'REQUESTED',
  MATCHED: 'MATCHED',
  DRIVER_ARRIVED: 'DRIVER_ARRIVED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
})

// The order a ride moves through, used to render progress. Mirrors the backend
// rule in backend/src/modules/rides/rideStatus.js.
export const RIDE_STATUS_ORDER = [
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.MATCHED,
  RIDE_STATUS.DRIVER_ARRIVED,
  RIDE_STATUS.ONGOING,
  RIDE_STATUS.COMPLETED,
]

// A server-side rule reflected here so the cancel button only ever appears when
// the backend would actually accept it. The backend enforces it regardless.
export const CANCELLABLE_RIDE_STATUSES = [
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.MATCHED,
]

export const VEHICLE_STATUS = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
})

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'CASH',
  TESLA_WALLET: 'TESLA_WALLET',
})

export const HISTORY_ACTIONS = [
  'REQUESTED',
  'ACCEPTED',
  'DRIVER_ARRIVED',
  'STARTED',
  'COMPLETED',
  'CANCELLED',
]