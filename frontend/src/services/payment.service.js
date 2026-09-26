import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// Passenger payments. POST creates a payment for a COMPLETED ride;
// GET returns the passenger's payment history with pickup/destination names.
export default {
  // POST /payments/:rideId — body `{ method: "CASH" | "TESLA_WALLET" }`.
  // Only allowed on COMPLETED rides. Returns the payment row.
  payForRide: (rideId, method) => client.post(`/payments/${rideId}`, { method }),

  // GET /payments/my — the signed-in passenger's payment history,
  // newest first. Each row includes ride_id, amount, method, status,
  // created_at, pickup_location, destination_location.
  getMyPayments: () => client.get('/payments/my'),
}