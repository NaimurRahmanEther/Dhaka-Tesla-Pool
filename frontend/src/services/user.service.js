import client from '@/api/client'

export default {
  getMe: () => client.get('/users/me'),
  updateMe: (payload) => client.patch('/users/me', payload),
}