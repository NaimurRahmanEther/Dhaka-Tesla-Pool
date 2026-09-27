import { ROLES } from '@/lib/constants'

// The one place that maps a role to its own home page. LoginPage (redirect
// after login), PublicOnlyRoute (bounce a signed-in user off /login and
// /register) and RoleRoute (send a wrong-role visitor to their own dashboard)
// must all agree on the URL, so this exists once instead of three times.
//
// Phase 6 mounts the matching pages at /passenger and /driver.
export function dashboardPathFor(role) {
  return role === ROLES.DRIVER ? '/driver' : '/passenger'
}