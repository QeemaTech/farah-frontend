import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function OnboardingGuard({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) {
      return
    }

    // ALWAYS allow admin routes - they are completely separate and don't need onboarding
    if (location.pathname.startsWith('/admin')) {
      setIsChecking(false)
      return
    }

    // If user is authenticated, allow access to protected routes
    if (isAuthenticated) {
      // If authenticated user tries to access root, splash, or onboarding, redirect to home
      if (location.pathname === '/' || location.pathname === '/splash' || location.pathname === '/onboarding') {
        navigate('/home', { replace: true })
        setIsChecking(false)
        return
      }
      setIsChecking(false)
      return
    }

    // If on splash or onboarding page, always allow access
    if (location.pathname === '/splash' || location.pathname === '/onboarding') {
      setIsChecking(false)
      return
    }

    // ALWAYS redirect root path to splash (which goes to onboarding)
    // This ensures onboarding is always the first thing users see
    if (location.pathname === '/') {
      navigate('/splash', { replace: true })
      setIsChecking(false)
      return
    }

    // For other routes, check if onboarding was completed
    const onboardingCompleted = localStorage.getItem('onboarding_completed')
    
    // If onboarding not completed, redirect to splash (which will go to onboarding)
    if (!onboardingCompleted) {
      // Only redirect if not already on splash or onboarding
      if (location.pathname !== '/splash' && location.pathname !== '/onboarding') {
        navigate('/splash', { replace: true })
      }
      setIsChecking(false)
      return
    }

    // Onboarding completed, allow access to login, register, OTP, and other routes
    setIsChecking(false)
  }, [navigate, location.pathname, isAuthenticated, authLoading])

  // Show loading while checking onboarding status
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

  // Render children (all routes)
  return children
}

export default OnboardingGuard
