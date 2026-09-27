import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// History endpoints. Passenger gets all their rides; driver gets completed
// pools. Both are role-locked (403 if wrong role calls them).
export default {
  // GET /history/passenger — PASSENGER only. Returns array of:
  // { ride_id, status, fare, requested_at, completed_at, pickup_location, destination_location }
  getPassengerHistory: () => client.get('/history/passenger'),

  // GET /history/driver — DRIVER only. Returns array of:
  // { pool_id, completed_at, model, vehicle_id, ride_id, status, fare,
  //   ride_completed_at, passenger_name, pickup_location, destination_location, seats_allocated }
  getDriverHistory: () => client.get('/history/driver'),
}