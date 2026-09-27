import client from '@/api/client'

export default {
  createVehicle: (body) => client.post('/vehicle', body),

  getMyVehicle: () => client.get('/vehicle/me'),

  updateStatus: (status) => client.patch('/vehicle/status', { status }),
}