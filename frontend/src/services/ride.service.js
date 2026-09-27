import client from '@/api/client'

export default {
  createRide: (body) => client.post('/rides', body),

  getMyRides: () => client.get('/rides/my'),

  cancelRide: (rideId) => client.patch(`/rides/${rideId}/cancel`),

  getRideHistory: (rideId) => client.get(`/rides/${rideId}/history`),
}