import client from '@/api/client'

export default {
  getAll: () => client.get('/location'),
}