import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPostAuthPath, isPublicAuthPath } from '../utils/authRoutes'

function OnboardingGuard({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (authLoading) {
      return
    }

    // Admin + /provider/* → vendor portal (skip mobile onboarding/login)
    if (
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/provider')
    ) {
      setIsChecking(false)
      return
    }

    if (isAuthenticated) {
      // Keep authenticated users off the entry/auth funnel
      if (
        location.pathname === '/' ||
        location.pathname === '/splash' ||
        location.pathname === '/onboarding'
      ) {
        navigate(getPostAuthPath(user), { replace: true })
        setIsChecking(false)
        return
      }
      setIsChecking(false)
      return
    }

    // Unauthenticated: always allow splash / onboarding / login funnel
    if (isPublicAuthPath(location.pathname)) {
      setIsChecking(false)
      return
    }

    if (location.pathname === '/') {
      navigate('/splash', { replace: true })
      setIsChecking(false)
      return
    }

    const onboardingCompleted = localStorage.getItem('onboarding_completed')

    // Deep links (e.g. /provider/dashboard) before onboarding → splash first
    if (!onboardingCompleted) {
      navigate('/splash', { replace: true })
      setIsChecking(false)
      return
    }

    // Onboarding done but not logged in — let ProtectedRoute send them to login
    setIsChecking(false)
  }, [navigate, location.pathname, isAuthenticated, authLoading, user])

  if (isChecking || authLoading) {
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

  return children
}

export default OnboardingGuard
