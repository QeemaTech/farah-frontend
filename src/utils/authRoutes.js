/**
 * Shared post-auth destinations and public auth paths for route guards.
 */

export const PUBLIC_AUTH_PATHS = [
  '/splash',
  '/onboarding',
  '/login',
  '/register',
  '/otp',
  '/forgot-password',
  '/reset-password',
]

export function isPublicAuthPath(pathname) {
  return PUBLIC_AUTH_PATHS.includes(pathname)
}

export function getPostAuthPath(user) {
  if (user?.role === 'PROVIDER') return '/provider/dashboard'
  if (user?.role === 'ADMIN') return '/admin/dashboard'
  return '/home'
}

export function resolvePostAuthPath(user, fromPathname) {
  if (
    fromPathname &&
    fromPathname !== '/' &&
    fromPathname !== '/splash' &&
    fromPathname !== '/onboarding' &&
    fromPathname !== '/login' &&
    fromPathname !== '/register' &&
    fromPathname !== '/otp'
  ) {
    return fromPathname
  }
  return getPostAuthPath(user)
}
