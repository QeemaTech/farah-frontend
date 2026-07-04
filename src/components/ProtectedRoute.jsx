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
    // Always redirect to splash (which goes to onboarding) first
    // This ensures onboarding is always shown first
    return <Navigate to="/splash" replace />
  }

  // Check if this is the location permission page - allow access
  if (location.pathname === '/location-permission') {
    return children
  }

  // Check if location permission was granted
  const locationPermission = localStorage.getItem('location_permission_granted')
  
  // If trying to access home or other protected routes, check location permission
  if (!locationPermission || locationPermission === 'denied') {
    // Redirect to location permission page first
    return <Navigate to="/location-permission" replace />
  }

  return children
}

export default ProtectedRoute




