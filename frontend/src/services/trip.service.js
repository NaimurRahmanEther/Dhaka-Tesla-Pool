import client from '@/api/client'

export default {
  getMyActiveTrip: () => client.get('/trips/my-active'),
  updatePassenger: (poolId, rideId, action) => client.patch(`/trips/${poolId}/rides/${rideId}/${action}`),
  cancel: (poolId) => client.patch(`/trips/${poolId}/cancel`),
  complete: (poolId) => client.patch(`/trips/${poolId}/complete`),
}
