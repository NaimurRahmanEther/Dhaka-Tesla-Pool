import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
//
// The vehicle endpoints. GET /vehicle/me returns a 404 when the driver has no
// Tesla yet - the page treats that as an empty state and shows the registration
// form, not an error.
export default {
  // POST /vehicle — body `{ model, capacity, currentLocationId }`, all three
  // values validated by the backend: model is a string of at least 2 chars,
  // capacity and currentLocationId are positive integers (numbers, not strings).
  createVehicle: (body) => client.post('/vehicle', body),

  // GET /vehicle/me — the driver's Tesla row, or 404 when none exists. The row
  // is raw snake_case: { id, driver_id, model, capacity, current_location_id,
  // status, created_at }.
  getMyVehicle: () => client.get('/vehicle/me'),

  // PATCH /vehicle/status — body `{ status: "ONLINE" | "OFFLINE" }`. Returns the
  // updated row. The backend enforces the enum.
  updateStatus: (status) => client.patch('/vehicle/status', { status }),
}