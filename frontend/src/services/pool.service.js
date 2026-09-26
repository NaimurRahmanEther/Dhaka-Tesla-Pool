import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// Pool endpoints. The one the frontend uses is the driver's passenger
// manifest, which needs the poolId that the active-trip response supplies —
// the page threads it through and never invents it.
export default {
  // GET /pool/:poolId/passengers — DRIVER only; the backend verifies the
  // caller owns the pool (403 otherwise). Returns { poolId, vehicle: { model,
  // capacity }, occupiedSeats, availableSeats, passengers: [{ rideId, name,
  // pickup, destination, seatsAllocated, status, fare }] }.
  getPoolPassengers: (poolId) => client.get(`/pool/${poolId}/passengers`),
}