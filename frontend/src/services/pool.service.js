import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// Pool endpoints. The driver side reads the passenger manifest (poolId comes
// from the active-trip response); the passenger side joins a pool by the ID
// the driver shares — there is no public pool directory, so the ID is the only
// way in.
export default {
  // POST /pool/:poolId/add-passenger — PASSENGER only; body { rideId } with
  // rideId as a JSON number. The backend enforces ownership of the ride (403
  // otherwise) and that the ride is still REQUESTED. Returns { poolRide, pool,
  // ride, fare, fareBreakdown } with the shared-trip discount already applied.
  // A pool that filled up answers 409 with a NO_SEAT reason.
  addPassenger: (poolId, rideId) => client.post(`/pool/${poolId}/add-passenger`, { rideId }),

  // GET /pool/:poolId/passengers — DRIVER only; the backend verifies the
  // caller owns the pool (403 otherwise). Returns { poolId, vehicle: { model,
  // capacity }, occupiedSeats, availableSeats, passengers: [{ rideId, name,
  // pickup, destination, seatsAllocated, status, fare }] }.
  getPoolPassengers: (poolId) => client.get(`/pool/${poolId}/passengers`),
}