import client from '@/api/client'

export default {
  addPassenger: (poolId, rideId) => client.post(`/pool/${poolId}/add-passenger`, { rideId }),

  getPoolPassengers: (poolId) => client.get(`/pool/${poolId}/passengers`),
}