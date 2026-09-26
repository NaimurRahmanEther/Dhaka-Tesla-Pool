import client from '@/api/client'

// URL building only. The HTTP work happens in src/api/client.js.
export default {
  getMe: () => client.get('/users/me'),
  updateMe: (payload) => client.patch('/users/me', payload),
}