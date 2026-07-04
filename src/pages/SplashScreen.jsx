import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function SplashScreen() {
  const navigate = useNavigate()
  const [appLogo, setAppLogo] = useState(null)
  const [appName, setAppName] = useState('أفراحنا')
  const [appNameAr, setAppNameAr] = useState('أفراحنا')
  const [showLogo, setShowLogo] = useState(true)

  const settingsFetchedRef = useRef(false)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Fetch app settings only once on mount
    if (settingsFetchedRef.current || fetchingRef.current) {
      return
    }

    const fetchSettings = async () => {
      fetchingRef.current = true
      try {
        const response = await axios.get(`${API_URL}/mobile/settings`, {
          timeout: 5000 // 5 second timeout
        })
        if (response.data.success && response.data.settings) {
          const settings = response.data.settings
          setAppName(settings.appName || 'Farah')
          setAppNameAr(settings.appNameAr || 'أفراحنا')
          if (settings.appLogo) {
            setAppLogo(settings.appLogo)
          }
        }
        settingsFetchedRef.current = true
      } catch (error) {
        // Use defaults if API fails - don't retry
        console.warn('Could not fetch app settings:', error)
        settingsFetchedRef.current = true
      } finally {
        fetchingRef.current = false
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    // Show splash for 2 seconds, then navigate to onboarding
    const timer = setTimeout(() => {
      navigate('/onboarding', { replace: true })
    }, 2000)

    return () => clearTimeout(timer)
  }, [navigate])

  // Check if logo is valid using the same validation as formatImageSrc
  const logoSrc = formatImageSrc(appLogo)
  const hasValidLogo = logoSrc !== null && logoSrc !== undefined && showLogo

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto flex items-center justify-center">
      <StatusBar />
      
      {/* Logo and Text */}
      <div className="flex flex-col items-center justify-center gap-6 px-4">
        {/* App Logo or Default Rings Icon */}
        {hasValidLogo && logoSrc ? (
          <div className="relative">
            <img
              key={logoSrc.substring(0, 50)}
              src={logoSrc}
              alt={appNameAr || appName}
              className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] object-contain"
              onError={(e) => {
                setShowLogo(false)
                e.target.style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className="relative">
            <svg 
              width="120" 
              height="120" 
              viewBox="0 0 120 120" 
              fill="none" 
              className="text-[#2D2871] w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Left Ring */}
              <ellipse
                cx="40"
                cy="60"
                rx="22"
                ry="28"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              {/* Right Ring */}
              <ellipse
                cx="80"
                cy="60"
                rx="22"
                ry="28"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              {/* Horizontal Lines connecting rings */}
              <path
                d="M28 60L48 60M72 60L92 60"
                stroke="currentColor"
                strokeWidth="2"
              />
              {/* Diamond on Top Ring */}
              <path
                d="M80 28L87 42L80 48L73 42Z"
                fill="currentColor"
                opacity="0.85"
              />
              <circle cx="80" cy="35" r="2" fill="white" opacity="0.7" />
            </svg>
          </div>
        )}

        {/* App Name */}
        <h1 className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-[#2D2871] text-[28px] sm:text-[32px] leading-[1.2] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          {appNameAr || appName}
        </h1>
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-[10px] left-1/2 transform -translate-x-1/2">
        <div className="bg-[rgba(27,27,27,0.85)] w-[134px] h-[5px] rounded-[2.5px]"></div>
      </div>
    </div>
  )
}

export default SplashScreen
