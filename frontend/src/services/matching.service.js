import client from '@/api/client'

export default {
  getOpenRequests: () => client.get('/matching/requests'),

  acceptRequest: (rideId, { changeRoute = false } = {}) =>
    client.post(`/matching/${rideId}/accept`, { changeRoute }),
}
