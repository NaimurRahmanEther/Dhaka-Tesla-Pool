import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
export default {
  // GET /health does not use the { success, message, data } envelope - it
  // returns { success, status, database, uptime } directly, so it is fetched
  // raw. Confirmed against the route in backend/src/app.js.
  getHealth: () => client.get('/health', { raw: true }),
}