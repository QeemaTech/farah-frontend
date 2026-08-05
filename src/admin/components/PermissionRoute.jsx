import { Navigate, useLocation } from 'react-router-dom'
import {
  readAdminUser,
  isFullAdminUser,
  hasPermission,
  getPortalHomePath,
  getPortalLoginPath,
} from '../utils/adminSession'

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {boolean} [props.requireFullAdmin]
 * @param {{ resource: string, action: string }} [props.permission]
 * @param {string[]} [props.hideForVendorTypes] — block PROVIDER when vendorType is in list
 * @param {string[]} [props.vendorTypesOnly] — allow only these vendor types (plus full admin)
 * @param {boolean} [props.providerPortal] — any approved vendor (role PROVIDER), plus full admin
 * @param {boolean} [props.hideForFullAdmin] — block full admin (e.g. vendor-only write routes)
 */
function PermissionRoute({ children, requireFullAdmin, permission, hideForVendorTypes, vendorTypesOnly, providerPortal, hideForFullAdmin }) {
  const location = useLocation()
  const user = readAdminUser()
  const home = getPortalHomePath(user)
  const loginPath = getPortalLoginPath(location.pathname)

  if (!user) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  const full = isFullAdminUser(user)

  if (requireFullAdmin && !full) {
    return <Navigate to={home} replace />
  }

  if (hideForFullAdmin && full) {
    return <Navigate to={home} replace />
  }

  if (permission && !hasPermission(user, permission.resource, permission.action)) {
    // Never bounce an authenticated vendor off their home to login
    const fallback = location.pathname === home ? loginPath : home
    if (location.pathname === home) {
      // Stale/missing permission list — still allow portal home for PROVIDER
      if (user.role === 'PROVIDER') return children
      return <Navigate to={fallback} replace state={{ from: location }} />
    }
    return <Navigate to={fallback} replace />
  }

  if (user.role === 'PROVIDER' && hideForVendorTypes?.length && hideForVendorTypes.includes(user.vendorType)) {
    return <Navigate to={home} replace />
  }

  if (vendorTypesOnly?.length && user.role === 'PROVIDER' && !vendorTypesOnly.includes(user.vendorType)) {
    return <Navigate to={home} replace />
  }

  if (providerPortal && !full && user.role !== 'PROVIDER') {
    return <Navigate to={home} replace />
  }

  return children
}

export default PermissionRoute
