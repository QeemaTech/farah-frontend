import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPostAuthPath } from '../utils/authRoutes'

/**
 * PublicRoute - Redirects authenticated users away from public pages (login, onboarding)
 * Only allows access if user is NOT authenticated
 */
function PublicRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()

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

  if (isAuthenticated) {
    return <Navigate to={getPostAuthPath(user)} replace />
  }

  return children
}

export default PublicRoute
