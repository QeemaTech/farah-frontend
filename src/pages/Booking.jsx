import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'
import MainHeader from '../components/MainHeader'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Booking() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState('الكل')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const filters = ['الكل', 'قيد الانتظار', 'جاري التنفيذ', 'منتهي', 'ملغي']

  useEffect(() => {
    fetchBookings()
  }, [activeFilter])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Map filter to backend status
      let status = ''
      if (activeFilter === 'قيد الانتظار') {
        status = 'pending'
      } else if (activeFilter === 'جاري التنفيذ') {
        status = 'active' // Maps to IN_PROGRESS in backend
      } else if (activeFilter === 'منتهي') {
        status = 'completed' // Maps to COMPLETED in backend
      } else if (activeFilter === 'ملغي') {
        status = 'cancelled' // Maps to CANCELLED in backend
      }
      // 'الكل' -> empty string, no filter
      
      const params = status ? { status } : {}
      const response = await axios.get(`${API_URL}/mobile/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      
      // Normalize booking data to ensure services are always in consistent format
      const normalizedBookings = (response.data.bookings || []).map((booking) => {
        // Handle services - convert bookingServices array to simple service names array
        let services = []
        let serviceObjects = [] // Keep full service objects for service-only bookings
        
        if (booking.services && Array.isArray(booking.services)) {
          // Handle BookingService objects with nested service
          serviceObjects = booking.services
          services = booking.services.map((bs) => {
            if (typeof bs === 'string') return bs
            if (bs && typeof bs === 'object') {
              if (bs.service && typeof bs.service === 'object') {
                return String(bs.service.nameAr || bs.service.name || 'خدمة')
              }
              return String(bs.nameAr || bs.name || 'خدمة')
            }
            return 'خدمة'
          }).filter(s => s && typeof s === 'string')
        } else if (booking.bookingServices && Array.isArray(booking.bookingServices)) {
          serviceObjects = booking.bookingServices
          services = booking.bookingServices.map((bs) => {
            if (typeof bs === 'string') return bs
            if (bs && typeof bs === 'object') {
              if (bs.service && typeof bs.service === 'object') {
                return String(bs.service.nameAr || bs.service.name || 'خدمة')
              }
              return String(bs.nameAr || bs.name || 'خدمة')
            }
            return 'خدمة'
          }).filter(s => s && typeof s === 'string')
        }
        
        // Determine booking type
        const isServiceOnly = booking.bookingType === 'SERVICES_ONLY' || (!booking.venueId && services.length > 0)
        const isVenueOnly = booking.bookingType === 'VENUE_ONLY' || (booking.venueId && services.length === 0)
        const isMixed = booking.bookingType === 'MIXED' || (booking.venueId && services.length > 0)
        
        // For service-only bookings, use service information
        let displayName = 'قاعة'
        let displayDescription = ''
        let displayAddress = ''
        let displayImage = booking.image
        let displayRating = booking.rating || 0
        
        if (isServiceOnly) {
          // Service-only booking - use first service as primary display
          const firstService = serviceObjects[0]
          if (firstService && firstService.service) {
            displayName = firstService.service.nameAr || firstService.service.name || 'خدمة'
            displayDescription = firstService.service.descriptionAr || firstService.service.description || ''
            displayAddress = firstService.locationAddress || booking.locationAddress || booking.location || ''
            // Get image from service
            if (firstService.service.images) {
              if (Array.isArray(firstService.service.images) && firstService.service.images.length > 0) {
                displayImage = firstService.service.images[0]
              } else if (typeof firstService.service.images === 'string') {
                displayImage = firstService.service.images
              }
            }
            displayRating = firstService.service.rating || 0
          } else if (services.length > 0) {
            // Fallback to service name string
            displayName = services[0]
            displayDescription = 'خدمة'
          }
        } else if (isVenueOnly || isMixed) {
          // Venue booking - use venue information
          displayName = booking.venue?.nameAr || booking.venue?.name || booking.venueName || 'قاعة'
          displayDescription = booking.venue?.descriptionAr || booking.venue?.description || booking.venueDescription || ''
          displayAddress = booking.venue?.location || booking.venue?.address || booking.address || ''
          if (booking.venue?.images) {
            if (Array.isArray(booking.venue.images) && booking.venue.images.length > 0) {
              displayImage = booking.venue.images[0]
            } else if (typeof booking.venue.images === 'string') {
              displayImage = booking.venue.images
            }
          }
          displayRating = booking.venue?.rating || 0
        }
        
        return {
          ...booking,
          services: services,
          serviceObjects: serviceObjects, // Keep for reference
          venueName: displayName,
          venueDescription: displayDescription,
          address: displayAddress,
          image: displayImage,
          date: booking.eventDate || (booking.date ? new Date(booking.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : ''),
          rating: displayRating,
          isServiceOnly,
          isVenueOnly,
          isMixed,
        }
      })
      
      setBookings(normalizedBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      // If 401 (Unauthorized) or "User not found", clear token and redirect to login
      if (error.response?.status === 401 || error.response?.data?.error === 'User not found') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
        return
      }
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    // Map backend status values to display
    const statusMap = {
      PENDING: { text: 'قيد الانتظار', color: 'bg-[#007aff]' },
      CONFIRMED: { text: 'مؤكد', color: 'bg-[#34c759]' },
      IN_PROGRESS: { text: 'جاري التنفيذ', color: 'bg-[#34c759]' },
      ACTIVE: { text: 'نشط', color: 'bg-[#34c759]' },
      COMPLETED: { text: 'منتهي', color: 'bg-[#666]' },
      CANCELLED: { text: 'ملغي', color: 'bg-[#ff3b30]' },
      // Also support lowercase for backward compatibility
      pending: { text: 'قيد الانتظار', color: 'bg-[#007aff]' },
      confirmed: { text: 'مؤكد', color: 'bg-[#34c759]' },
      'in_progress': { text: 'جاري التنفيذ', color: 'bg-[#34c759]' },
      active: { text: 'جاري التنفيذ', color: 'bg-[#34c759]' },
      completed: { text: 'منتهي', color: 'bg-[#666]' },
      cancelled: { text: 'ملغي', color: 'bg-[#ff3b30]' },
    }
    const statusInfo = statusMap[status] || statusMap.PENDING
    return (
      <div className={`${statusInfo.color} content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[24px] shrink-0`}>
        <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[11px] text-white tracking-[0.22px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
          {statusInfo.text}
        </p>
      </div>
    )
  }

  const getServiceIcon = (serviceName) => {
    if (serviceName.includes('تصوير') || serviceName.includes('مصور')) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 5.5C9.38071 5.5 10.5 6.61929 10.5 8C10.5 9.38071 9.38071 10.5 8 10.5C6.61929 10.5 5.5 9.38071 5.5 8C5.5 6.61929 6.61929 5.5 8 5.5Z"
            stroke="#4d4d4d"
            strokeWidth="1.5"
          />
          <path
            d="M2 5.33333H4.66667L5.33333 3.33333H10.6667L11.3333 5.33333H14C14.3682 5.33333 14.6667 5.63181 14.6667 6V12.6667C14.6667 13.0349 14.3682 13.3333 14 13.3333H2C1.63181 13.3333 1.33333 13.0349 1.33333 12.6667V6C1.33333 5.63181 1.63181 5.33333 2 5.33333Z"
            stroke="#4d4d4d"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    } else if (serviceName.includes('طعام') || serviceName.includes('بوفيه') || serviceName.includes('تقديم')) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2V14M3 6H13M3 10H13"
            stroke="#4d4d4d"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M4 3H12C12.5523 3 13 3.44772 13 4V12C13 12.5523 12.5523 13 12 13H4C3.44772 13 3 12.5523 3 12V4C3 3.44772 3.44772 3 4 3Z"
            stroke="#4d4d4d"
            strokeWidth="1.5"
          />
        </svg>
      )
    }
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1V15M1 8H15"
          stroke="#4d4d4d"
          strokeWidth="1.5"
        />
      </svg>
    )
  }

  // Booking flow is now handled in NewBookingSteps page
  // Users should start booking from venue details page only

  return (
  <>
  
  
  
  <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">

{/* Main Header */}
<MainHeader />

{/* Decorative Background */}
<div className="absolute contents left-[-249px] top-[-335px] pointer-events-none">
  <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
    <div className="h-[342.961px] relative w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full"></div>
  </div>
</div>

     {/* Main Content */}
     <div className="absolute content-stretch flex flex-col gap-[10px] items-start left-[20px] top-[100px] w-[350px] overflow-y-auto pb-[100px]">
       {/* Filter Tabs */}
  <div className="bg-white content-stretch flex h-[40px] items-center justify-between p-[2px] relative rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.2)] shrink-0 w-[350px]">
    {filters.map((filter) => (
      <button
        key={filter}
        onClick={() => setActiveFilter(filter)}
        className={`content-stretch flex h-[36px] items-center justify-center overflow-clip px-[16px] py-[8px] relative rounded-[24px] shrink-0 flex-1 ${
          activeFilter === filter
            ? 'bg-[#edecf8]'
            : ''
        }`}
      >
        <p className={`font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[16px] tracking-[0.32px] ${
          activeFilter === filter ? 'text-[#2d2871]' : 'text-[#666]'
        }`} style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
          {filter}
        </p>
      </button>
    ))}
  </div>

  {/* Bookings List */}
  {loading ? (
    <div className="text-center py-10 w-full">جاري التحميل...</div>
  ) : (
    <div className="flex flex-col gap-[10px] w-full">
      {bookings.length === 0 ? (
        <div className="text-center py-10 text-gray-500">لا توجد حجوزات</div>
      ) : (
        bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col items-end overflow-clip p-[10px] relative rounded-[16px] shrink-0 w-full"
        >
          <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
              {/* Status Badge on Top Left */}
              <div className="absolute top-[10px] left-[10px] z-10">
                {getStatusBadge(booking.status)}
              </div>
              
              {/* Content on Right */}
              <div className="content-stretch flex gap-[10px] items-start relative shrink-0 flex-1">
                <div className="content-stretch flex flex-col gap-[4px] items-end justify-center relative shrink-0 flex-1">
                  <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                    {booking.isServiceOnly ? 'خدمة' : booking.venueName}
                  </p>
                  <div className="content-stretch flex flex-col items-end justify-center relative shrink-0 w-full">
                    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#999] text-[11px] tracking-[0.22px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                      {booking.isServiceOnly ? booking.venueName : booking.venueDescription}
                    </p>
                  </div>
                  {booking.rating > 0 && (
                    <div className="content-stretch flex gap-px items-center justify-center relative shrink-0">
                      <p className="font-['Poppins:Medium',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[12px] text-[rgba(35,31,32,0.86)] tracking-[0.24px]">
                        {booking.rating.toFixed(1)}
                      </p>
                      <div className="flex items-center justify-center relative shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 0L10.1631 5.52786L16 6.11146L11.8541 9.94428L13.0557 16L8 12.5279L2.94427 16L4.1459 9.94428L0 6.11146L5.83686 5.52786L8 0Z"
                            fill="#FFD700"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {/* Image on Far Right */}
                <div className="h-[96px] w-[96px] relative rounded-[13px] shrink-0 overflow-hidden">
                  <div className="absolute bg-[#d9d9d9] inset-0 rounded-[13px]"></div>
                  <img
                    src={booking.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'}
                    alt={booking.venueName}
                    className="absolute max-w-none object-cover rounded-[13px] size-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-0 relative shrink-0 w-full">
              <div className="absolute inset-[-0.5px_0]">
                <svg width="350" height="1" viewBox="0 0 350 1" fill="none">
                  <line x1="0" y1="0.5" x2="350" y2="0.5" stroke="#F2F2F2" strokeWidth="1" />
                </svg>
              </div>
            </div>
            
            {/* Location, Date, Services */}
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
              {/* Location */}
              <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
                <div className="content-stretch flex gap-[5px] items-center justify-center relative shrink-0">
                  <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#4d4d4d] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                    {booking.address}
                  </p>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 1C5.24 1 3 3.24 3 6C3 10.5 8 15 8 15C8 15 13 10.5 13 6C13 3.24 10.76 1 8 1Z"
                      stroke="#4d4d4d"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 8.5C8.83 8.5 9.5 7.83 9.5 7C9.5 6.17 8.83 5.5 8 5.5C7.17 5.5 6.5 6.17 6.5 7C6.5 7.83 7.17 8.5 8 8.5Z"
                      stroke="#4d4d4d"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
              
              {/* Date */}
              <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
                <div className="content-stretch flex gap-[5px] items-center justify-center relative shrink-0">
                  <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#4d4d4d] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                    {booking.date}
                  </p>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 4H14V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V4Z"
                      stroke="#4d4d4d"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M5 2V4M11 2V4M2 6H14"
                      stroke="#4d4d4d"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
              
              {/* Services with Icons */}
              {booking.services && Array.isArray(booking.services) && booking.services.length > 0 && (
                <>
                  {booking.services.map((service, idx) => {
                    const serviceName = typeof service === 'string' ? service : String(service || 'خدمة')
                    
                    return (
                      <div key={idx} className="content-stretch flex items-center justify-end relative shrink-0 w-full">
                        <div className="content-stretch flex gap-[5px] items-center justify-center relative shrink-0">
                          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#4d4d4d] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                            {serviceName}
                          </p>
                          {getServiceIcon(serviceName)}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            {(booking.status === 'CANCELLED' || booking.status === 'cancelled' || 
              booking.status === 'COMPLETED' || booking.status === 'completed') ? (
              <div className="content-stretch flex items-end relative shrink-0 w-full">
                <button
                  onClick={() => navigate(`/booking/${booking.id}`)}
                  className="bg-[#2d2871] content-stretch flex flex-[1_0_0] h-[36px] items-center justify-center min-h-px min-w-px overflow-clip px-[16px] py-[8px] relative rounded-[24px] shrink-0"
                >
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[16px] text-white tracking-[0.32px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                    إعادة الحجز
                  </p>
                </button>
              </div>
            ) : (
              <div className="content-stretch flex gap-[8px] items-end relative shrink-0 w-full">
                <button 
                  onClick={async () => {
                    if (confirm('هل أنت متأكد من إلغاء الحجز؟')) {
                      try {
                        const token = localStorage.getItem('token')
                        await axios.patch(`${API_URL}/mobile/bookings/${booking.id}/cancel`, {}, {
                          headers: { Authorization: `Bearer ${token}` }
                        })
                        fetchBookings()
                      } catch (error) {
                        console.error('Error cancelling booking:', error)
                        alert(error.response?.data?.error || 'فشل إلغاء الحجز')
                      }
                    }
                  }}
                  className="bg-[#f2f2f2] content-stretch flex flex-[1_0_0] h-[36px] items-center justify-center min-h-px min-w-px overflow-clip px-[16px] py-[8px] relative rounded-[24px] shrink-0"
                >
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#666] text-[16px] tracking-[0.32px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                    إلغاء الحجز
                  </p>
                </button>
                <button
                  onClick={() => navigate(`/booking/${booking.id}`)}
                  className="bg-[#2d2871] content-stretch flex flex-[1_0_0] h-[36px] items-center justify-center min-h-px min-w-px overflow-clip px-[16px] py-[8px] relative rounded-[24px] shrink-0"
                >
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[16px] text-white tracking-[0.32px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                    تعديل الحجز
                  </p>
                </button>
              </div>
            )}
          </div>
        </div>
        ))
      )}
    </div>
  )}
</div>

     </div>
     <BottomNavigation />
       
       </>
       )
     }

export default Booking
