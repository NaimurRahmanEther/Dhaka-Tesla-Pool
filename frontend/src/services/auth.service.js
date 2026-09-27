import client from '@/api/client'

export default {
  register: (payload) => client.post('/auth/register', payload),
  login: (email, password) => client.post('/auth/login', { email, password }),
  refreshToken: () => client.post('/auth/refresh-token'),
  logout: () => client.post('/auth/logout'),
}