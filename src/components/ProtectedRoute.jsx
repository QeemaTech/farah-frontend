import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">جاري التحميل...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const onboardingCompleted = localStorage.getItem('onboarding_completed')
    if (!onboardingCompleted) {
      return <Navigate to="/splash" replace />
    }
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Location permission screen itself — always allow
  if (location.pathname === '/location-permission') {
    return children
  }

  // Provider/admin areas don't require the mobile location gate
  const skipLocationGate =
    location.pathname.startsWith('/provider') ||
    location.pathname.startsWith('/admin')

  if (!skipLocationGate) {
    const locationPermission = localStorage.getItem('location_permission_granted')
    // Only gate when the user has never been asked (null). 'denied' / 'true' both allow through.
    if (!locationPermission) {
      return (
        <Navigate
          to="/location-permission"
          replace
          state={{ from: location }}
        />
      )
    }
  }

  return children
}

export default ProtectedRoute
