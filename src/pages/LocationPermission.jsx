import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

function LocationPermission() {
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState(null)
  const [mapCenter, setMapCenter] = useState({ lat: 24.7136, lng: 46.6753 }) // Riyadh default

  useEffect(() => {
    // Try to get user's current location if permission already granted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Location access denied or error - use default
          console.log('Location access not available')
        }
      )
    }
  }, [])

  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Save location permission status
          localStorage.setItem('location_permission_granted', 'true')
          localStorage.setItem('user_latitude', position.coords.latitude.toString())
          localStorage.setItem('user_longitude', position.coords.longitude.toString())
          
          // Navigate to home
          navigate('/home', { replace: true })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Even if there's an error, allow user to proceed
          localStorage.setItem('location_permission_granted', 'true')
          navigate('/home', { replace: true })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } else {
      // Geolocation not supported
      localStorage.setItem('location_permission_granted', 'true')
      navigate('/home', { replace: true })
    }
  }

  const handleDenyLocation = () => {
    // Save that user denied permission
    localStorage.setItem('location_permission_granted', 'denied')
    navigate('/home', { replace: true })
  }

  // Generate Google Maps embed URL (using public embed API - no key needed for basic embed)
  const mapUrl = `https://www.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=10&output=embed`

  return (
    <div className="bg-white overflow-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto flex flex-col">
      <StatusBar />

      {/* Map Section - Top 60% */}
      <div className="relative w-full h-[60%] flex-shrink-0">
        {/* Close Button */}
        <button
          onClick={handleDenyLocation}
          className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Map */}
        <div className="w-full h-full bg-gray-200 relative">
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location Map"
          />
          {/* Map Overlay for better UX */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-white/30"></div>
        </div>

        {/* Location Marker Overlay */}
        {userLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="relative">
              <div className="w-12 h-12 bg-[#2D2871] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="9" r="3" fill="white" />
                </svg>
              </div>
              <div className="absolute inset-0 w-12 h-12 bg-[#2D2871] rounded-full opacity-20 animate-ping"></div>
            </div>
          </div>
        )}
      </div>

      {/* Permission Request Overlay - Bottom 40% */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-10 flex flex-col items-center justify-between px-6 pt-8 pb-6 min-h-[40%]">
        {/* Text Content */}
        <div className="flex flex-col items-center gap-4 w-full">
          <h2 className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-[#121212] text-[20px] text-center leading-[1.3]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            يحتاج التطبيق الوصول إلى موقعك
          </h2>
          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[14px] text-center leading-[1.6] max-w-[320px]">
            للسماح لنا بتقديم أفضل تجربة وتسهيل عملية الحجز، نحتاج إلى الوصول إلى موقعك الحالي
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-6">
          {/* Allow Button */}
          <button
            onClick={handleAllowLocation}
            className="w-full bg-[#2D2871] text-white rounded-[16px] py-4 text-[16px] font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] hover:bg-[#1f1a5a] transition-colors shadow-lg"
            style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}
          >
            السماح للوصول للموقع
          </button>

          {/* Deny Button */}
          <button
            onClick={handleDenyLocation}
            className="w-full text-[#666] text-[14px] font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] py-2 hover:text-[#121212] transition-colors"
            style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}
          >
            عدم السماح
          </button>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-[10px] left-1/2 transform -translate-x-1/2">
          <div className="bg-[rgba(27,27,27,0.85)] w-[134px] h-[5px] rounded-[2.5px]"></div>
        </div>
      </div>
    </div>
  )
}

export default LocationPermission

