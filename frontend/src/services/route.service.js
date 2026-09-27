import client from '@/api/client'

export default {
  createRoute: (destinationLocationId, currentLocationId) =>
    client.post('/driver-routes', { destinationLocationId, currentLocationId }),

  getMyRoute: () => client.get('/driver-routes/me'),
}
