import client from '@/api/client'

export default {
  getMyActiveTrip: () => client.get('/trips/my-active'),

  arrive: (poolId) => client.patch(`/trips/${poolId}/arrive`),

  start: (poolId) => client.patch(`/trips/${poolId}/start`),

  complete: (poolId) => client.patch(`/trips/${poolId}/complete`),
}