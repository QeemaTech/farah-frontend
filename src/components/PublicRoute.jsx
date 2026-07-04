import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * PublicRoute - Redirects authenticated users away from public pages (login, onboarding)
 * Only allows access if user is NOT authenticated
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white max-w-[390px] mx-auto">
        <div className="text-center">
          <p className="text-[#2d2871] font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[16px]">
            جاري التحميل...
          </p>
        </div>
      </div>
    )
  }

  // If user is authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/splash" replace />
  }

  // User is not authenticated, allow access to public pages
  return children
}

export default PublicRoute

