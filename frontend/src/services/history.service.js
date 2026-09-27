import client from '@/api/client'

export default {
  getPassengerHistory: () => client.get('/history/passenger'),

  getDriverHistory: () => client.get('/history/driver'),
}