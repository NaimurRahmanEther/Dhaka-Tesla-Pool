import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// One file per backend module. Every URL this app calls for rides lives here so
// no page ever types a path.
export default {
  // POST /rides — body `{ pickupLocationId, destinationLocationId, seatsRequested }`,
  // all JSON numbers (a Select gives strings otherwise). Returns the new ride
  // row: status REQUESTED, fare null until a driver matches it.
  createRide: (body) => client.post('/rides', body),

  // GET /rides/my — the passenger's rides with pickup_location and
  // destination_location names joined in by the backend.
  getMyRides: () => client.get('/rides/my'),

  // PATCH /rides/:id/cancel — allowed by the backend only from REQUESTED or
  // MATCHED; it rejects anything later in the lifecycle.
  cancelRide: (rideId) => client.patch(`/rides/${rideId}/cancel`),

  // GET /rides/:id/history — the audit trail, open to the owner or the driver
  // serving the ride.
  getRideHistory: (rideId) => client.get(`/rides/${rideId}/history`),
}