import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import CustomizeVenueDrawer from '../components/CustomizeVenueDrawer'
import AdditionsDrawer from '../components/AdditionsDrawer'
import BookAppointmentDrawer from '../components/BookAppointmentDrawer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function BookingConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Get booking data from location state or sessionStorage backup
  const getBookingData = () => {
    const fromState = location.state?.bookingData || location.state?.booking || location.state || {}
    
    // If state has data (venue or services), use it
    if (fromState.venueId || fromState.venue?.id || fromState.serviceIds?.length > 0 || fromState.services?.length > 0) {
      return fromState
    }
    
    // Otherwise, try to restore from sessionStorage
    try {
      const saved = sessionStorage.getItem('bookingData_backup')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.venueId || parsed.serviceIds?.length > 0 || parsed.services?.length > 0) {
          return parsed
        }
      }
    } catch (error) {
      // Ignore storage errors
    }
    
    return {}
  }

  // Check if user came from booking steps - if not, redirect to home
  useEffect(() => {
    const bookingDataFromState = getBookingData()
    // Allow service-only bookings (no venue required)
    const hasVenue = bookingDataFromState.venueId || bookingDataFromState.venue?.id
    const hasServices = bookingDataFromState.serviceIds?.length > 0 || bookingDataFromState.services?.length > 0
    if (!hasVenue && !hasServices) {
      alert('يجب إكمال خطوات الحجز أولاً')
      navigate('/home')
    }
  }, [])

  // Get booking data from location state or sessionStorage
  const bookingDataFromState = getBookingData()
  const booking = {
    venueId: bookingDataFromState.venueId || bookingDataFromState.venue?.id,
    venueName: bookingDataFromState.venueName || bookingDataFromState.venue?.nameAr || bookingDataFromState.venue?.name || 'اسم القاعة',
    venuePrice: bookingDataFromState.venuePrice || bookingDataFromState.venue?.price || 28.0,
    venueImage: bookingDataFromState.venueImage || (Array.isArray(bookingDataFromState.venue?.images) ? bookingDataFromState.venue?.images[0] : bookingDataFromState.venue?.images),
    venueDescription: bookingDataFromState.venueDescription || bookingDataFromState.venue?.descriptionAr || bookingDataFromState.venue?.description || 'وصف القاعة وبعض خدماتها',
    address: bookingDataFromState.address || bookingDataFromState.venue?.location || bookingDataFromState.venue?.address || '19 احمد الصاوي, مدينة نصر',
    date: bookingDataFromState.date || bookingDataFromState.venue?.date,
    startTime: bookingDataFromState.startTime,
    endTime: bookingDataFromState.endTime,
    serviceIds: bookingDataFromState.serviceIds || bookingDataFromState.services || [],
    services: bookingDataFromState.services || [],
    location: bookingDataFromState.location,
    locationAddress: bookingDataFromState.locationAddress,
    locationLatitude: bookingDataFromState.locationLatitude,
    locationLongitude: bookingDataFromState.locationLongitude,
    customization: bookingDataFromState.customization,
    ...bookingDataFromState
  }
  const [discountCode, setDiscountCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [additionalServices, setAdditionalServices] = useState(booking.additionalServices || booking.additions || [])
  const [selectedCard, setSelectedCard] = useState(null)
  const [loadingCards, setLoadingCards] = useState(false)
  
  // Drawer states
  const [showCustomizeDrawer, setShowCustomizeDrawer] = useState(false)
  const [showAdditionsDrawer, setShowAdditionsDrawer] = useState(false)
  const [showDateDrawer, setShowDateDrawer] = useState(false)
  const [customization, setCustomization] = useState(booking.customization || null)

  // Fetch user's credit cards
  useEffect(() => {
    fetchUserCards()
  }, [])

  // Refresh cards when returning from add card page
  useEffect(() => {
    if (location.state?.refreshCards) {
      fetchUserCards()
      // Clear the refresh flag
      navigate(location.pathname, { replace: true, state: { ...location.state, refreshCards: false } })
    }
  }, [location.state?.refreshCards])

  const fetchUserCards = async () => {
    try {
      setLoadingCards(true)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await axios.get(`${API_URL}/mobile/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success && response.data.cards.length > 0) {
        // Set default card or first card
        const defaultCard = response.data.cards.find(c => c.isDefault) || response.data.cards[0]
        setSelectedCard(defaultCard)
      }
    } catch (error) {
      // Error fetching cards - silently fail
    } finally {
      setLoadingCards(false)
    }
  }

  const removeService = (id) => {
    setAdditionalServices(prev => prev.filter(s => s.id !== id))
  }

  // Calculate services price from booking data
  const servicesFromBooking = booking.services || []
  const servicesPrice = servicesFromBooking.reduce((sum, s) => {
    const price = typeof s === 'object' ? (s.price || 0) : 0
    return sum + parseFloat(price)
  }, 0)
  const additionalServicesPrice = additionalServices.reduce((sum, s) => sum + (parseFloat(s.price) || 50), 0)
  
  const summary = {
    venue: booking.venuePrice || 0,
    services: servicesPrice + additionalServicesPrice,
    discount: booking.discount || 0,
    total: (booking.venuePrice || 0) + servicesPrice + additionalServicesPrice - (booking.discount || 0),
  }

  const handleConfirmBooking = async () => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً')
      navigate('/login')
      return
    }

    // Allow booking without venue if services are provided
    if (!booking.venueId && (!booking.serviceIds || booking.serviceIds.length === 0)) {
      alert('يجب اختيار قاعة أو خدمة على الأقل')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      
      // Check if user has a card selected
      if (!selectedCard) {
        alert('يجب إضافة بطاقة ائتمانية للدفع')
        navigate('/add-card', { state: { from: 'booking-confirmation', bookingData: booking } })
        return
      }

      // Prepare services array - send as objects with location info when no venue
      let servicesArray = [];
      if (booking.services && booking.services.length > 0) {
        // If services array is provided, map to objects with location info
        servicesArray = booking.services.map(s => {
          const serviceId = typeof s === 'string' ? s : (s.id || s.serviceId);
          
          // For service-only bookings (no venue), include location info in each service
          if (!booking.venueId) {
            return {
              serviceId: serviceId,
              id: serviceId, // Also include id for compatibility
              date: booking.date instanceof Date ? booking.date.toISOString() : (booking.date || new Date().toISOString()),
              startTime: booking.startTime || null,
              endTime: booking.endTime || null,
              locationType: booking.location || 'home', // Map location to locationType
              locationAddress: booking.locationAddress || null,
              locationLatitude: booking.locationLatitude || null,
              locationLongitude: booking.locationLongitude || null,
              notes: booking.notes || null,
            };
          } else {
            // For venue bookings, just send ID or minimal object
            return typeof s === 'string' ? s : {
              serviceId: serviceId,
              id: serviceId,
            };
          }
        }).filter(Boolean);
      } else if (booking.serviceIds && booking.serviceIds.length > 0) {
        // If only serviceIds provided, convert to objects with location info when no venue
        if (!booking.venueId) {
          servicesArray = booking.serviceIds.map(serviceId => ({
            serviceId: serviceId,
            id: serviceId,
            date: booking.date instanceof Date ? booking.date.toISOString() : (booking.date || new Date().toISOString()),
            startTime: booking.startTime || null,
            endTime: booking.endTime || null,
            locationType: booking.location || 'home',
            locationAddress: booking.locationAddress || null,
            locationLatitude: booking.locationLatitude || null,
            locationLongitude: booking.locationLongitude || null,
            notes: booking.notes || null,
          }));
        } else {
          // For venue bookings, just send IDs
          servicesArray = booking.serviceIds;
        }
      }

      const bookingData = {
        venueId: booking.venueId || null, // Explicitly null when no venue (not undefined)
        date: booking.date instanceof Date ? booking.date.toISOString() : (booking.date || new Date().toISOString()),
        startTime: booking.startTime || null,
        endTime: booking.endTime || null,
        location: booking.location || null,
        locationAddress: booking.locationAddress || null,
        locationLatitude: booking.locationLatitude || null,
        locationLongitude: booking.locationLongitude || null,
        totalAmount: summary.total,
        services: servicesArray,
        notes: booking.notes || '',
        cardId: selectedCard.id, // Use card ID instead of payment method
      }

      const response = await axios.post(
        `${API_URL}/mobile/bookings`,
        bookingData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        navigate('/booking/success', {
          state: {
            booking: response.data.booking,
            bookingNumber: response.data.booking.bookingNumber,
          }
        })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'فشل إنشاء الحجز'
      alert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (


    <>
    
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">

{/* Decorative Background */}
<div className="absolute contents left-[-249px] top-[-335px] pointer-events-none">
  <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
    <div className="h-[342.961px] relative w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full"></div>
  </div>
</div>

{/* Header */}
<div className="absolute content-stretch flex items-center justify-between left-1/2 top-[66px] translate-x-[-50%] w-[350px]">
  <div className="content-stretch flex items-center justify-center opacity-0 relative shrink-0 size-[32px]"></div>
  <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
    تأكيد الحجز
  </p>
  <div className="flex items-center justify-center relative shrink-0">
    <button
      onClick={() => navigate(-1)}
      className="flex-none rotate-[180deg] scale-y-[-100%]"
    >
      <div className="relative size-[32px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="#121212"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </button>
  </div>
</div>

{/* Main Content */}
<div className="absolute content-stretch flex flex-col gap-[20px] h-[617px] items-start left-[20px] top-[118px] w-[350px] overflow-y-auto pb-[100px]">
  {/* Venue Info - Only show if venue exists */}
  {booking.venueId && (
  <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex gap-[16px] items-start justify-end overflow-clip p-[10px] relative rounded-[16px] shrink-0 w-full">
    <div className="content-stretch flex flex-[1_0_0] flex-col items-end min-h-px min-w-px relative shrink-0">
      <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
        <div className="content-stretch flex gap-px items-center relative shrink-0">
          <p className="font-['Poppins:Medium',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[12px] text-[rgba(35,31,32,0.86)] tracking-[0.24px]">
            4.5
          </p>
          <div className="flex items-center justify-center relative shrink-0">
            <div className="flex-none rotate-[180deg] scale-y-[-100%]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 0L10.1631 5.52786L16 6.11146L11.8541 9.94428L13.0557 16L8 12.5279L2.94427 16L4.1459 9.94428L0 6.11146L5.83686 5.52786L8 0Z"
                  fill="#FFD700"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[8px] items-end justify-center relative shrink-0">
          <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            {booking.venueName || 'اسم القاعة'}
          </p>
          <div className="content-stretch flex flex-col gap-[4px] items-end justify-center relative shrink-0 w-full">
            <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#999] text-[11px] tracking-[0.22px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              {booking.venueDescription || 'وصق القاعة وبعض خدماتها'}
            </p>
            <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#999] text-[11px] tracking-[0.22px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                {booking.address || '19 احمد الصاوي, مدينة نصر'}
              </p>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 5C5.82843 5 6.5 4.32843 6.5 3.5C6.5 2.67157 5.82843 2 5 2C4.17157 2 3.5 2.67157 3.5 3.5C3.5 4.32843 4.17157 5 5 5Z"
                  stroke="#999"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="aspect-[96/96] relative rounded-[13px] self-stretch shrink-0">
      <div className="absolute bg-[#d9d9d9] inset-0 rounded-[13px]"></div>
      <img
        src={booking.venueImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'}
        alt={booking.venueName}
        className="absolute max-w-none object-cover rounded-[13px] size-full"
      />
    </div>
  </div>
  )}

  {/* Selected Services */}
  {booking.services && booking.services.length > 0 && (
    <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-end px-[10px] py-[12px] relative rounded-[16px] shrink-0 w-full">
      <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
        <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          الخدمات المحددة
        </p>
      </div>
      {booking.services.map((service, idx) => (
        <div key={idx} className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          <p className="font-['Poppins:Medium',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[12px] text-black text-center">
            +{typeof service === 'object' && service.price ? service.price : 50} $
          </p>
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
            <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#121212] text-[12px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              {typeof service === 'object' ? (service.nameAr || service.name || 'خدمة') : service}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}

  {/* Additional Services */}
  <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-end px-[10px] py-[12px] relative rounded-[16px] shrink-0 w-full">
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
        الخدمات الإضافية
      </p>
    </div>
    {additionalServices.length === 0 ? (
      <p className="text-sm text-gray-500 text-center w-full">لا توجد خدمات إضافية</p>
    ) : (
      additionalServices.map((service) => (
        <div
          key={service.id}
          className="content-stretch flex items-center justify-between relative shrink-0 w-full"
        >
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <button
              onClick={() => removeService(service.id)}
              className="cursor-pointer hover:opacity-70 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                  stroke="#ff3b30"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 11V17M14 11V17"
                  stroke="#ff3b30"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="font-['Poppins:Medium',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[12px] text-black text-center">
              +{service.price || 50} $
            </p>
          </div>
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
            <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#121212] text-[12px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              {service.name || 'البوفيه'}
            </p>
            <div className="overflow-clip relative shrink-0 size-[32px] bg-gray-100 rounded flex items-center justify-center">
              {service.icon === 'buffet' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 6H21" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 10H16M8 14H16M8 18H16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : service.icon === 'camera' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : service.icon === 'beauty' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V16M8 12H16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : null}
            </div>
          </div>
        </div>
      ))
    )}
  </div>

  {/* Booking Location */}
  {booking.location && (
    <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-end px-[10px] py-[12px] relative rounded-[16px] shrink-0 w-full">
      <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          موقع الحجز
        </p>
      <div className="text-sm text-gray-600 text-right w-full">
        <p className="mb-1">
          {booking.location === 'artist' ? 'الموقع الخاص بالميكب ارتست' :
           booking.location === 'another' ? 'تحديد موقع آخر (+50$)' :
           booking.location === 'map' ? 'تحديد الموقع علي الخريطة' : booking.location}
        </p>
        {booking.locationAddress && (
          <p className="text-xs text-gray-500 mt-1">{booking.locationAddress}</p>
        )}
        {booking.locationLatitude && booking.locationLongitude && (
          <div className="mt-2">
            <a
              href={`https://www.google.com/maps?q=${booking.locationLatitude},${booking.locationLongitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2d2871] text-xs underline"
            >
              عرض على الخريطة
            </a>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Customization */}
  {booking.customization && (
    <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-end px-[10px] py-[12px] relative rounded-[16px] shrink-0 w-full">
      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
        <button
          onClick={() => setShowCustomizeDrawer(true)}
          className="content-stretch cursor-pointer flex gap-[4px] items-center p-0 relative shrink-0"
        >
          <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#2d2871] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
            تعديل
          </p>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M17.5 4.5L15.5 2.5L4.5 13.5L2.5 17.5L6.5 15.5L17.5 4.5Z" stroke="#2d2871" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          تخصيص القاعة
        </p>
      </div>
      {typeof booking.customization === 'object' ? (
        Object.entries(booking.customization).map(([key, value], idx) => (
          <div key={idx} className="content-stretch flex items-center justify-end relative shrink-0 w-full">
            <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#121212] text-[12px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              {value}
            </p>
            <span className="mr-2 text-gray-500 text-sm">({key})</span>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-600 text-right w-full">{booking.customization}</p>
      )}
    </div>
  )}

  {/* Booking Date */}
  <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] h-[85px] items-end px-[10px] py-[12px] relative rounded-[16px] shrink-0 w-full">
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <button
        onClick={() => setShowDateDrawer(true)}
        className="relative shrink-0 size-[24px] cursor-pointer hover:opacity-70 transition-opacity"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M11 5H13M11 9H13M11 13H13M5 3H19C19.5523 3 20 3.44772 20 4V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3Z"
            stroke="#007AFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          تاريخ الحجز
        </p>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M2 4H18V17C18 17.5523 17.5523 18 17 18H3C2.44772 18 2 17.5523 2 17V4Z"
            stroke="#121212"
            strokeWidth="1.5"
          />
          <path
            d="M5 2V4M15 2V4M2 6H18"
            stroke="#121212"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
    <div className="flex flex-col font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#666] text-[14px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
      <p className="leading-[1.5]">
        {booking.date 
          ? (booking.date instanceof Date 
              ? booking.date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
              : typeof booking.date === 'string' 
                ? new Date(booking.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                : booking.date)
          : 'لم يتم تحديد تاريخ'}
      </p>
      {booking.startTime && booking.endTime && (
        <p className="leading-[1.5] mt-1 text-sm font-medium">
          الوقت: {booking.startTime} - {booking.endTime}
        </p>
      )}
    </div>
  </div>

  {/* Discount Code */}
  <div className="border border-[#f2f2f2] border-solid content-stretch flex h-[50px] items-center justify-between px-[12px] py-[10px] relative rounded-[12px] shrink-0 w-[350px]">
    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#2d2871] text-[14px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
      تطبيق
    </p>
    <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-[188px]">
      <input
        type="text"
        value={discountCode}
        onChange={(e) => setDiscountCode(e.target.value)}
        placeholder="كود خصم"
        className="flex-1 text-right text-[16px] text-[#666] outline-none"
        dir="rtl"
      />
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M2 6H18V14C18 14.5523 17.5523 15 17 15H3C2.44772 15 2 14.5523 2 14V6Z"
          stroke="#666"
          strokeWidth="1.5"
        />
        <path
          d="M6 10H14"
          stroke="#666"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  </div>

  {/* Payment Summary */}
  <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-end p-[10px] relative rounded-[16px] shrink-0 w-full">
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          ملخص الدفع
        </p>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="#121212"
            strokeWidth="1.5"
          />
          <path
            d="M10 6V10L12 12"
            stroke="#121212"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
    <div className="bg-[#edecf8] border border-[#2d2871] border-dashed content-stretch flex flex-col gap-[8px] items-start p-[14px] relative rounded-[12px] shrink-0 w-full">
      {summary.venue > 0 && (
        <div className="content-stretch flex items-center justify-between leading-[1.5] relative shrink-0 text-[#666] text-[14px] w-full">
          <p className="font-['Poppins:Regular',sans-serif] not-italic relative shrink-0">
            {summary.venue.toFixed(2)}$
          </p>
          <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
            حجز القاعة
          </p>
        </div>
      )}
      {servicesPrice > 0 && (
        <div className="content-stretch flex items-center justify-between leading-[1.5] relative shrink-0 text-[#666] text-[14px] w-full">
          <p className="font-['Poppins:Regular',sans-serif] not-italic relative shrink-0">
            {servicesPrice.toFixed(2)}$
          </p>
          <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
            الخدمات المحددة
          </p>
        </div>
      )}
      {additionalServices.length > 0 && (
        <div className="content-stretch flex items-center justify-between leading-[1.5] relative shrink-0 text-[#666] text-[14px] w-full">
          <p className="font-['Poppins:Regular',sans-serif] not-italic relative shrink-0">
            {additionalServicesPrice.toFixed(2)}$
          </p>
          <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
            خدمات إضافية
          </p>
        </div>
      )}
      <div className="content-stretch flex items-center justify-between leading-[1.5] relative shrink-0 text-[#666] text-[14px] w-full">
        <p className="font-['Poppins:Regular',sans-serif] not-italic relative shrink-0">
          {summary.discount.toFixed(2)}$-
        </p>
        <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
          خصم
        </p>
      </div>
      <div className="flex items-center justify-center relative shrink-0 w-full">
        <div className="flex-none rotate-[180deg] w-full">
          <div className="h-0 relative w-full">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg width="350" height="1" viewBox="0 0 350 1" fill="none">
                <line x1="0" y1="0.5" x2="350" y2="0.5" stroke="#121212" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex items-center justify-between leading-[1.5] relative shrink-0 text-[#1a1a1a] text-[14px] w-full">
        <p className="font-['Poppins:Bold',sans-serif] not-italic relative shrink-0">
          {summary.total.toFixed(2)}$
        </p>
        <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] relative shrink-0 text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          إجمالي تكلفة التأمين
        </p>
      </div>
    </div>
  </div>

  {/* Action Buttons */}
  <div className="flex flex-col gap-3 w-full">
    <button
      onClick={() => setShowAdditionsDrawer(true)}
      className="bg-white border border-[#f2f2f2] rounded-xl px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800">إضافة خدمات إضافية</span>
      </div>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#2d2871" strokeWidth="1.5"/>
        <path d="M10 6V14M6 10H14" stroke="#2d2871" strokeWidth="1.5"/>
      </svg>
    </button>
    
    <button
      onClick={() => setShowCustomizeDrawer(true)}
      className="bg-white border border-[#f2f2f2] rounded-xl px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800">تخصيص القاعة</span>
      </div>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M2 6H18V14C18 14.5523 17.5523 15 17 15H3C2.44772 15 2 14.5523 2 14V6Z" stroke="#2d2871" strokeWidth="1.5"/>
      </svg>
    </button>
  </div>

  {/* Credit Card Selection */}
  <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-end p-[10px] relative rounded-[16px] shrink-0 w-full">
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <button 
        onClick={() => navigate('/add-card', { state: { from: 'booking-confirmation', bookingData: booking } })}
        className="content-stretch cursor-pointer flex gap-[4px] items-center p-0 relative shrink-0"
      >
        <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#2d2871] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
          {selectedCard ? 'تغيير البطاقة' : 'إضافة بطاقة'}
        </p>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="#2d2871"
            strokeWidth="1.5"
          />
          <path
            d="M10 6V14M6 10H14"
            stroke="#2d2871"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          بطاقة الدفع
        </p>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M2 6H18V14C18 14.5523 17.5523 15 17 15H3C2.44772 15 2 14.5523 2 14V6Z"
            stroke="#121212"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
    
    {loadingCards ? (
      <div className="w-full text-center py-4 text-gray-500">جاري تحميل البطاقات...</div>
    ) : selectedCard ? (
      <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-xl p-4 text-white w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">{selectedCard.cardholderName}</div>
          <div className="text-xs">VISA</div>
        </div>
        <div className="text-lg font-bold tracking-wider mb-2">{selectedCard.cardNumber}</div>
        <div className="text-xs">VALID THRU {selectedCard.expiryDate}</div>
      </div>
    ) : (
      <div className="w-full text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-xl">
        لا توجد بطاقة مضافة. اضغط على "إضافة بطاقة" لإضافة بطاقة للدفع.
      </div>
    )}
  </div>
</div>


</div>
          {/* Bottom Action Button */}
          <div className="absolute bg-white bottom-0 content-stretch flex flex-col items-center left-1/2 pb-0 pt-[10px] px-0 rounded-tl-[16px] rounded-tr-[16px] translate-x-[-50%] w-[393px]">
        <button
          onClick={handleConfirmBooking}
          disabled={submitting}
          className="bg-[#2d2871] content-stretch cursor-pointer flex h-[55px] items-center justify-center p-[10px] relative rounded-[38px] shrink-0 w-[350px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-left text-white uppercase" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            {submitting ? 'جاري المعالجة...' : 'تأكيد الدفع'}
          </p>
        </button>
        <div className="bg-white h-[35px] relative shrink-0 w-full">
          <div className="absolute bg-[#4e5868] inset-[55.88%_32%_29.41%_32.27%] rounded-[2.5px]"></div>
        </div>
      </div>

      {/* Drawers */}
      <CustomizeVenueDrawer
        isOpen={showCustomizeDrawer}
        onClose={() => setShowCustomizeDrawer(false)}
        onNext={(custom) => {
          setCustomization(custom)
          setShowCustomizeDrawer(false)
        }}
        customization={customization}
        onCustomizationChange={setCustomization}
      />

      <AdditionsDrawer
        isOpen={showAdditionsDrawer}
        onClose={() => setShowAdditionsDrawer(false)}
        onContinue={(additions) => {
          const services = additions.map(id => {
            if (id === 'buffet') return { id: 'buffet', name: 'البوفيه', price: 50, icon: 'buffet' }
            if (id === 'photographers') return { id: 'photographer', name: 'مصور', price: 50, icon: 'camera' }
            if (id === 'beautyExpert') return { id: 'beautyExpert', name: 'خبيرة تجميل', price: 50, icon: 'beauty' }
            return null
          }).filter(Boolean)
          setAdditionalServices(services)
          setShowAdditionsDrawer(false)
        }}
        onSkip={() => {
          setAdditionalServices([])
          setShowAdditionsDrawer(false)
        }}
        selectedAdditions={additionalServices.map(s => s.id)}
        onAdditionsChange={(ids) => {
          const services = ids.map(id => {
            if (id === 'buffet') return { id: 'buffet', name: 'البوفيه', price: 50, icon: 'buffet' }
            if (id === 'photographers') return { id: 'photographer', name: 'مصور', price: 50, icon: 'camera' }
            if (id === 'beautyExpert') return { id: 'beautyExpert', name: 'خبيرة تجميل', price: 50, icon: 'beauty' }
            return null
          }).filter(Boolean)
          setAdditionalServices(services)
        }}
      />

      <BookAppointmentDrawer
        isOpen={showDateDrawer}
        onClose={() => setShowDateDrawer(false)}
        onConfirm={(date) => {
          // Update booking date
          if (date instanceof Date) {
            booking.date = date.toISOString()
          } else {
            booking.date = date
          }
          setShowDateDrawer(false)
        }}
        selectedDate={booking.date ? (typeof booking.date === 'string' ? new Date(booking.date) : booking.date) : null}
        onDateChange={(date) => {
          if (date instanceof Date) {
            booking.date = date.toISOString()
          } else {
            booking.date = date
          }
        }}
      />
    </>
  )
}

export default BookingConfirmation
