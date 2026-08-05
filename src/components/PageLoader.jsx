import { useState, useEffect, useRef, useMemo } from 'react' 
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function isPortalPath(pathname) {
  return pathname.startsWith('/admin') || pathname.startsWith('/provider')
}

function PageLoader() {
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [showLogo, setShowLogo] = useState(true)
  const [appSettings, setAppSettings] = useState({
    appName: 'Farah',
    appNameAr: 'فرح',
    appLogo: null,
  })
  const fetchingRef = useRef(false)
  const fetchedRouteTypesRef = useRef(new Set())
  const lastPathnameRef = useRef(location.pathname)
  const loadingTimerRef = useRef(null)
  const maxLoadingTimerRef = useRef(null)
  const isInitialMountRef = useRef(true)
  const loaderKeyRef = useRef(0)

  // Memoize route type to prevent unnecessary recalculations
  const routeType = useMemo(() => {
    return isPortalPath(location.pathname) ? 'admin' : 'mobile'
  }, [location.pathname])

  // Fetch settings once per route type (admin/mobile) - only when route type changes
  useEffect(() => {
    // Check if we already fetched for this route type
    if (fetchedRouteTypesRef.current.has(routeType)) {
      return
    }
    
    // Check if currently fetching
    if (fetchingRef.current) {
      return
    }

    const isAdminRoute = routeType === 'admin'
    
    const fetchSettings = async () => {
      fetchingRef.current = true
      try {
        const endpoint = isAdminRoute ? `${API_URL}/settings` : `${API_URL}/mobile/settings`
        const response = await axios.get(endpoint, {
          timeout: 5000 // 5 second timeout
        })
        
        if (response.data.success && response.data.settings) {
          const settings = response.data.settings
          setAppSettings({
            appName: settings.appName || 'Farah',
            appNameAr: settings.appNameAr || 'فرح',
            appLogo: isAdminRoute ? settings.dashboardLogo : settings.appLogo,
          })
        }
        fetchedRouteTypesRef.current.add(routeType)
      } catch (error) {
        // Use defaults if API fails - mark as fetched to prevent retries
        fetchedRouteTypesRef.current.add(routeType)
      } finally {
        fetchingRef.current = false
      }
    }
    
    fetchSettings()
  }, [routeType]) // Only run when route type changes (admin <-> mobile)

  useEffect(() => {
    // Skip loader on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      lastPathnameRef.current = location.pathname
      setLoading(false) // Ensure loading is false on initial mount
      return
    }

    // Only show loader if pathname actually changed
    if (lastPathnameRef.current === location.pathname) {
      return
    }

    const prevPath = lastPathnameRef.current
    const nextPath = location.pathname

    // Skip overlay inside admin/vendor portal (same desktop shell)
    if (isPortalPath(prevPath) && isPortalPath(nextPath)) {
      lastPathnameRef.current = nextPath
      setLoading(false)
      return
    }

    // Don't show loader for redirects from splash/onboarding to home (common after login)
    const isRedirectFromSplash = prevPath === '/splash' && nextPath === '/home'
    const isRedirectFromOnboarding = prevPath === '/onboarding' && nextPath === '/home'
    
    // Update last pathname immediately
    lastPathnameRef.current = nextPath

    // Skip loader for common redirects after login/register
    if (isRedirectFromSplash || isRedirectFromOnboarding) {
      setLoading(false)
      return
    }

    // Never show the mobile splash overlay when landing on the portal
    if (isPortalPath(nextPath)) {
      setLoading(false)
      return
    }

    // Clear any existing timers first
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
      loadingTimerRef.current = null
    }
    if (maxLoadingTimerRef.current) {
      clearTimeout(maxLoadingTimerRef.current)
      maxLoadingTimerRef.current = null
    }

    // Show loader for other route changes
    loaderKeyRef.current += 1 // Increment key to force remount
    setLoading(true)
    setShowLogo(true)

    // Hide loader after 500ms
    loadingTimerRef.current = setTimeout(() => {
      if (loadingTimerRef.current) {
        setLoading(false)
        loadingTimerRef.current = null
      }
    }, 500)

    // Safety fallback: Force hide loader after 2 seconds max
    maxLoadingTimerRef.current = setTimeout(() => {
      if (maxLoadingTimerRef.current) {
        setLoading(false)
        maxLoadingTimerRef.current = null
      }
    }, 2000)

    return () => {
      // Cleanup timers
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
      if (maxLoadingTimerRef.current) {
        clearTimeout(maxLoadingTimerRef.current)
        maxLoadingTimerRef.current = null
      }
      // Ensure loading state is reset on cleanup
      setLoading(false)
    }
  }, [location.pathname])

  // Check if we're in admin/vendor dashboard
  const isAdminRoute = isPortalPath(location.pathname)
  // Check if logo is valid using the same validation as formatImageSrc
  const logoSrc = formatImageSrc(appSettings.appLogo)
  const hasValidLogo = logoSrc !== null && logoSrc !== undefined

  // Don't render if not loading - use portal-like approach to prevent DOM issues
  if (!loading) {
    return null
  }

  // Admin Dashboard Loader - Full screen, no mobile constraints
  if (isAdminRoute) {
    return (
      <div 
        key={`loader-admin-${location.pathname}-${loaderKeyRef.current}`} 
        className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Dashboard Logo */}
          {hasValidLogo && showLogo && logoSrc ? (
            <img
              key={`logo-admin-${logoSrc.substring(0, 50)}`}
              src={logoSrc}
              alt={appSettings.appName}
              className="w-32 h-32 object-contain"
              onError={(e) => {
                setShowLogo(false)
                if (e.target && e.target.parentNode) {
                  e.target.style.display = 'none'
                }
              }}
            />
          ) : null}
          {(!hasValidLogo || !showLogo) && (
            <div className="w-32 h-32 bg-gradient-to-br from-[#2d2871] to-[#1f1a5a] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-4xl font-bold">
                {appSettings.appNameAr?.charAt(0) || appSettings.appName?.charAt(0) || 'F'}
              </span>
            </div>
          )}

          {/* App Name */}
          <h2 className="text-[#2d2871] font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-3xl">
            {appSettings.appNameAr || appSettings.appName}
          </h2>

          {/* Loading Spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[#2d2871] border-t-transparent rounded-full animate-spin"></div>
          </div>

          {/* Loading Text */}
          <p className="text-[#666] font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-base mt-2">
            جاري التحميل...
          </p>
        </div>
      </div>
    )
  }

  // Mobile App Loader - Constrained to mobile width
  return (
    <div 
      key={`loader-mobile-${location.pathname}-${loaderKeyRef.current}`} 
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center max-w-[390px] mx-auto"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        {/* App Logo */}
        {hasValidLogo && showLogo && logoSrc ? (
          <img
            key={`logo-mobile-${logoSrc.substring(0, 50)}`}
            src={logoSrc}
            alt={appSettings.appName}
            className="w-24 h-24 object-contain mb-4"
            onError={(e) => {
              setShowLogo(false)
              if (e.target && e.target.parentNode) {
                e.target.style.display = 'none'
              }
            }}
          />
        ) : null}
        {(!hasValidLogo || !showLogo) && (
          <div className="w-24 h-24 bg-[#2d2871] rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">
              {appSettings.appNameAr?.charAt(0) || appSettings.appName?.charAt(0) || 'F'}
            </span>
          </div>
        )}

        {/* App Name */}
        <h2 className="text-[#2d2871] font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-2xl">
          {appSettings.appNameAr}
        </h2>

        {/* Loading Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-[#2d2871] border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <p className="text-[#666] font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-sm mt-2">
          جاري التحميل...
        </p>
      </div>
    </div>
  )
}

export default PageLoader

