import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// The driver's request board. GET returns every ride still waiting for a
// driver, enriched with the fields computed for THIS driver's Tesla: freeSeats,
// detourKm, detourAcceptable, fitsInMyTesla. The backend sorts takeable
// requests first, so the page renders the list as-is and never re-sorts.
// POST /matching/:rideId accepts one request into the driver's pool.
export default {
  // GET /matching/requests — 403 with a human message when the driver has no
  // Tesla ("Register a Tesla before browsing requests") or is offline ("Go
  // online before browsing requests"). The page treats a 403 as a "go set up
  // your Tesla" state, not a raw error.
  getOpenRequests: () => client.get('/matching/requests'),

  // POST /matching/:rideId/accept — claims a seat for the ride. Returns
  // { assignment, driver, vehicleId, pooled, route, fare, fareBreakdown }.
  // A race for the last seat comes back as 409 with a NO_SEAT reason.
  acceptRequest: (rideId) => client.post(`/matching/${rideId}/accept`),
}