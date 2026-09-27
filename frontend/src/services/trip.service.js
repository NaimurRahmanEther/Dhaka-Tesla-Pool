import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// The driver's active trip. GET returns one row per rider in the active pool
// (pool_id, vehicle model + capacity, passenger name, pickup/destination,
// seats allocated, ride_status), or a 404 when there is no active trip — the
// page treats that 404 as an empty state. The lifecycle moves ride by ride:
// MATCHED -> DRIVER_ARRIVED -> ONGOING -> COMPLETED, forward only. All actions
// take the poolId that the active-trip response provides; the page never
// guesses it.
export default {
  // GET /trips/my-active — array of pool-rider rows, or 404 "No active trip
  // found". The lifecycle step is rows[0].ride_status.
  getMyActiveTrip: () => client.get('/trips/my-active'),

  // PATCH /trips/:poolId/arrive — MATCHED -> DRIVER_ARRIVED for every ride in
  // the pool. 409 if the rides are not MATCHED yet.
  arrive: (poolId) => client.patch(`/trips/${poolId}/arrive`),

  // PATCH /trips/:poolId/start — DRIVER_ARRIVED -> ONGOING. 409 if the driver
  // has not arrived first.
  start: (poolId) => client.patch(`/trips/${poolId}/start`),

  // PATCH /trips/:poolId/complete — ONGOING -> COMPLETED and the pool closes.
  // 409 if the trip has not started or is already completed.
  complete: (poolId) => client.patch(`/trips/${poolId}/complete`),
}