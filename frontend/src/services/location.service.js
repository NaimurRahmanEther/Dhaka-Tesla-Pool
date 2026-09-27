import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
export default {
  // GET /location is public - no token needed. Returns real rows from the
  // locations table: { id, name, latitude, longitude }.
  getAll: () => client.get('/location'),
}