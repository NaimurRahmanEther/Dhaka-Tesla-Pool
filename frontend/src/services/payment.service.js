import client from '@/api/client'

export default {
  payForRide: (rideId, method) => client.post(`/payments/${rideId}`, { method }),

  getMyPayments: () => client.get('/payments/my'),
}