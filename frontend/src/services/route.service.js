import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// The driver's planned route. POST calculates the shortest path from the
// Tesla's current location to the destination and stores it; GET returns the
// latest one, or a 404 when the driver has never planned a route (an empty
// state, not an error).
export default {
  // POST /driver-routes — body `{ destinationLocationId }`, a positive integer.
  // Returns the stored route row: { id, driver_id, start_location_id,
  // destination_location_id, route: { path, distance }, created_at }.
  createRoute: (destinationLocationId) =>
    client.post('/driver-routes', { destinationLocationId }),

  // GET /driver-routes/me — the latest planned route, or 404.
  getMyRoute: () => client.get('/driver-routes/me'),
}