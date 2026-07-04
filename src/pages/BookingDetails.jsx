import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function BookingDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchedBookingIdRef = useRef(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Only fetch if booking ID changed and we're not already fetching
    if (fetchedBookingIdRef.current === id || fetchingRef.current || !id) {
      return
    }

    fetchBookingDetails()
  }, [id])

  const fetchBookingDetails = async () => {
    if (fetchingRef.current || !id) return
    
    fetchingRef.current = true
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/mobile/bookings/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      })
      setBooking(response.data.booking)
      fetchedBookingIdRef.current = id
    } catch (error) {
      // Silently fail if backend is not available
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error('Error fetching booking details:', error)
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <div className="text-center">جاري التحميل...</div>
      </div>
    )
  }

  // Normalize booking data
  const displayBooking = booking ? {
    id: booking.id,
    status: booking.status || 'pending',
    venueName: booking.venue?.nameAr || booking.venue?.name || booking.venueName || 'اسم القاعة',
    venueDescription: booking.venue?.descriptionAr || booking.venue?.description || booking.venueDescription || 'وصف القاعة وبعض خدماتها',
    address: booking.venue?.location || booking.venue?.address || booking.address || 'مدينة نصر، القاهرة',
    date: booking.eventDate 
      ? new Date(booking.eventDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
      : booking.date || '12 مارس 2026',
    services: booking.bookingServices?.map(bs => bs.service?.nameAr || bs.service?.name || 'خدمة') || 
             booking.services?.map(s => typeof s === 'string' ? s : (s.nameAr || s.name || 'خدمة')) || 
             ['خدمة تصوير', 'خدمة تقديم طعام'],
    rating: booking.venue?.rating || booking.rating || 4.5,
    image: booking.venue?.images 
      ? (Array.isArray(booking.venue.images) ? booking.venue.images[0] : booking.venue.images)
      : booking.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    paymentMethod: booking.payments?.[0]?.paymentMethod || booking.paymentMethod || 'أبل باي',
    paymentAmount: booking.payments?.[0]?.amount || booking.totalAmount || booking.paymentAmount || 26.0,
  } : {
    id: '1',
    status: 'pending',
    venueName: 'اسم القاعة',
    venueDescription: 'وصف القاعة وبعض خدماتها',
    address: 'مدينة نصر، القاهرة',
    date: '12 مارس 2026',
    services: ['خدمة تصوير', 'خدمة تقديم طعام'],
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    paymentMethod: 'أبل باي',
    paymentAmount: 26.0,
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
          تفاصيل الحجز
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
      <div className="absolute bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-end left-1/2 overflow-clip p-[10px] rounded-[16px] top-[118px] translate-x-[-50%] w-[350px]">
        <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
          {(() => {
            const statusMap = {
              pending: { text: 'قادم', color: 'bg-[#007aff]' },
              active: { text: 'جاري التنفيذ', color: 'bg-[#34c759]' },
              completed: { text: 'منتهي', color: 'bg-[#666]' },
              cancelled: { text: 'ملغي', color: 'bg-[#ff3b30]' },
            }
            const statusInfo = statusMap[displayBooking.status] || statusMap.pending
            return (
              <div className={`${statusInfo.color} content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[24px] shrink-0`}>
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[11px] text-white tracking-[0.22px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {statusInfo.text}
                </p>
              </div>
            )
          })()}
          <div className="content-stretch flex gap-[10px] items-start relative shrink-0">
            <div className="content-stretch flex flex-col gap-[4px] items-end justify-center relative shrink-0">
              <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] min-w-full relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px] w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {displayBooking.venueName}
              </p>
              <div className="content-stretch flex flex-col items-end justify-center relative shrink-0 w-full">
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#999] text-[11px] tracking-[0.22px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {displayBooking.venueDescription}
                </p>
              </div>
              <div className="content-stretch flex gap-px items-center justify-center relative shrink-0">
                <p className="font-['Poppins:Medium',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[12px] text-[rgba(35,31,32,0.86)] tracking-[0.24px]">
                  {displayBooking.rating}
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
            </div>
            <div className="aspect-[96/96] relative rounded-[13px] self-stretch shrink-0">
              <div className="absolute bg-[#d9d9d9] inset-0 rounded-[13px]"></div>
              <img
                src={displayBooking.image}
                alt={displayBooking.venueName}
                className="absolute max-w-none object-cover rounded-[13px] size-full"
              />
            </div>
          </div>
        </div>
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-0.5px_0]">
            <svg width="350" height="1" viewBox="0 0 350 1" fill="none">
              <line x1="0" y1="0.5" x2="350" y2="0.5" stroke="#F2F2F2" strokeWidth="1" />
            </svg>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
          <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
            <div className="content-stretch flex gap-[5px] items-center justify-center relative shrink-0">
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#4d4d4d] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                {displayBooking.address}
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
          <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
            <div className="content-stretch flex gap-[5px] items-center justify-center relative shrink-0">
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#4d4d4d] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                {displayBooking.date}
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
          {displayBooking.services && displayBooking.services.map((service, idx) => (
            <div key={idx} className="content-stretch flex items-center justify-end relative shrink-0 w-full">
              <div className="content-stretch flex gap-[5px] items-center justify-center relative shrink-0">
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#4d4d4d] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {service}
                </p>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1V15M1 8H15"
                    stroke="#4d4d4d"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-0.5px_-0.15%]">
            <svg width="350" height="1" viewBox="0 0 350 1" fill="none">
              <line x1="0" y1="0.5" x2="350" y2="0.5" stroke="#121212" strokeWidth="1" />
            </svg>
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
            <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#2d2871] text-[16px] tracking-[0.32px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              تحميل
            </p>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15V3M12 3L8 7M12 3L16 7"
                stroke="#2d2871"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17H22"
                stroke="#2d2871"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
            <div className="content-stretch flex flex-col items-end relative shrink-0">
              <div className="capitalize flex flex-col font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] justify-end leading-[0] relative shrink-0 text-[#262626] text-[14px] text-right w-full" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                <p className="leading-[16px] whitespace-pre-wrap">تفاصيل الدفع</p>
              </div>
              <div className="content-stretch flex gap-[2px] items-start justify-end leading-[0] relative shrink-0 text-[#8a8a8a] text-[12px] text-right w-full whitespace-nowrap">
                <div className="flex flex-col font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] justify-center relative shrink-0" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  <p className="leading-[1.36]">{displayBooking.paymentMethod}</p>
                </div>
                <div className="flex flex-col font-['Poppins:Medium',sans-serif] justify-center not-italic relative shrink-0">
                  <p className="leading-[1.36]">-</p>
                </div>
                <div className="flex flex-col font-['Poppins:Medium',sans-serif] justify-center not-italic relative shrink-0">
                  <p className="leading-[1.36]">{(displayBooking.paymentAmount || displayBooking.finalAmount || 0).toFixed(2)}$</p>
                </div>
              </div>
            </div>
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
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-0.5px_-0.15%]">
            <svg width="350" height="1" viewBox="0 0 350 1" fill="none">
              <line x1="0" y1="0.5" x2="350" y2="0.5" stroke="#121212" strokeWidth="1" />
            </svg>
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#ff3b30] text-[16px] tracking-[0.32px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
            إلغاء
          </p>
          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#e5171e] text-[10px] text-right w-[159px] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
            يتم إلغاء الحجز خلال يومين فقط من تاريخ الحجز
          </p>
        </div>
        
        {/* Slaughter Calculator Link */}
        <div className="h-0 relative shrink-0 w-full mt-2">
          <div className="absolute inset-[-0.5px_-0.15%]">
            <svg width="350" height="1" viewBox="0 0 350 1" fill="none">
              <line x1="0" y1="0.5" x2="350" y2="0.5" stroke="#121212" strokeWidth="1" />
            </svg>
          </div>
        </div>
        <div 
          onClick={() => navigate('/slaughter', { state: { bookingId: booking.id } })}
          className="bg-indigo-50 content-stretch flex items-center justify-between p-3 relative rounded-xl w-full cursor-pointer hover:bg-indigo-100 transition-colors mt-2"
        >
          <div className="flex flex-col text-right w-full">
            <div className="flex items-center justify-end gap-2 mb-1">
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-indigo-700 text-sm">
                احسب واطلب ذبائح لفرحك 🐑
              </p>
            </div>
            <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] text-indigo-600/80 text-[10px]">
              خدمة إضافية مجانية للحساب والطلب من موردين معتمدين
            </p>
          </div>
        </div>
      </div>

    </div>
    
      {/* Bottom Action Button */}
      <div className="absolute bg-white bottom-0 content-stretch flex flex-col items-center left-1/2 pb-0 pt-[10px] px-0 rounded-tl-[16px] rounded-tr-[16px] translate-x-[-50%] w-[393px]">
        <button
          onClick={() => navigate('/booking/add')}
          className="bg-[#2d2871] content-stretch flex h-[55px] items-center justify-center p-[10px] relative rounded-[38px] shrink-0 w-[350px]"
        >
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-white uppercase" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            تعديل الحجز
          </p>
        </button>
        <div className="bg-white h-[35px] relative shrink-0 w-full">
          <div className="absolute bg-[#4e5868] inset-[55.88%_32%_29.41%_32.27%] rounded-[2.5px]"></div>
        </div>
      </div>
    
    </>
 
  )
}

export default BookingDetails
