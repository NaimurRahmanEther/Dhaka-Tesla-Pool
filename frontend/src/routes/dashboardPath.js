import { ROLES } from '@/lib/constants'

export function dashboardPathFor(role) {
  return role === ROLES.DRIVER ? '/driver' : '/passenger'
}