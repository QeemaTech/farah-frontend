import { Navigate, useLocation } from 'react-router-dom'
import {
  readAdminUser,
  isFullAdminUser,
  hasPermission,
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

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  const full = isFullAdminUser(user)

  if (requireFullAdmin && !full) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (hideForFullAdmin && full) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (permission && !hasPermission(user, permission.resource, permission.action)) {
    // Avoid infinite redirect when already on /admin/dashboard (e.g. stale permissions in localStorage).
    const fallback =
      location.pathname === '/admin/dashboard' ? '/admin/login' : '/admin/dashboard'
    return <Navigate to={fallback} replace state={{ from: location }} />
  }

  if (user.role === 'PROVIDER' && hideForVendorTypes?.length && hideForVendorTypes.includes(user.vendorType)) {
    const fallback =
      location.pathname === '/admin/dashboard' ? '/admin/login' : '/admin/dashboard'
    return <Navigate to={fallback} replace />
  }

  if (vendorTypesOnly?.length && user.role === 'PROVIDER' && !vendorTypesOnly.includes(user.vendorType)) {
    const fallback =
      location.pathname === '/admin/dashboard' ? '/admin/login' : '/admin/dashboard'
    return <Navigate to={fallback} replace />
  }

  if (providerPortal && !full && user.role !== 'PROVIDER') {
    const fallback =
      location.pathname === '/admin/dashboard' ? '/admin/login' : '/admin/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}

export default PermissionRoute
