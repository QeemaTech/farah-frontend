import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function AdminBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [search])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, limit: 50 }
      })
      setBookings(response.data.bookings || [])
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/admin/bookings/${id}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchBookings()
    } catch (error) {
      alert('فشل تحديث الحالة')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { text: 'قيد الانتظار', color: 'bg-[#fff3cd] text-[#856404]' },
      CONFIRMED: { text: 'مؤكد', color: 'bg-[#d1ecf1] text-[#0c5460]' },
      IN_PROGRESS: { text: 'جاري التنفيذ', color: 'bg-[#d4edda] text-[#155724]' },
      ACTIVE: { text: 'نشط', color: 'bg-[#d4edda] text-[#155724]' },
      COMPLETED: { text: 'منتهي', color: 'bg-[#d1ecf1] text-[#0c5460]' },
      CANCELLED: { text: 'ملغي', color: 'bg-[#f8d7da] text-[#721c24]' },
    }
    return statusMap[status] || statusMap.PENDING
  }

  const getBookingTypeBadge = (bookingType) => {
    const typeMap = {
      VENUE_ONLY: { text: 'قاعة فقط', color: 'bg-blue-100 text-blue-800' },
      SERVICES_ONLY: { text: 'خدمات فقط', color: 'bg-purple-100 text-purple-800' },
      MIXED: { text: 'قاعة + خدمات', color: 'bg-green-100 text-green-800' },
    }
    return typeMap[bookingType] || { text: bookingType || '-', color: 'bg-gray-100 text-gray-800' }
  }

  const getLocationTypeText = (locationType) => {
    const locationMap = {
      venue: 'قاعة',
      home: 'منزل',
      hotel: 'فندق',
      outdoor: 'خارجي',
      other: 'أخرى',
    }
    return locationMap[locationType] || locationType || '-'
  }

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      <StatusBar />

      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-[20px] top-[66px] w-[350px] z-20">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center justify-center relative shrink-0 size-[32px] bg-white rounded-full shadow-sm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
            <path
              d="M15 18L9 12L15 6"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center flex-1" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          إدارة الحجوزات
        </p>
        <div className="w-[32px]"></div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-[350px] left-[20px] top-[132px] overflow-y-auto pb-[100px]">
        
        {/* Search Bar */}
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الحجوزات..."
            className="bg-white border border-[#e6e6e6] border-solid content-stretch flex flex-[1_0_0] h-[44px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 outline-none text-right"
            dir="rtl"
          />
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-10 w-full">جاري التحميل...</div>
        ) : (
          <div className="content-stretch flex flex-col gap-[12px] items-stretch relative shrink-0 w-full">
            {bookings.map((booking) => {
              const statusInfo = getStatusBadge(booking.status)
              const bookingTypeInfo = getBookingTypeBadge(booking.bookingType)
              return (
                <div
                  key={booking.id}
                  className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full"
                >
                  <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0 flex-1">
                      <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-full">
                        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                          {booking.bookingNumber}
                        </p>
                        <span className={`px-[8px] py-[2px] rounded-[8px] ${bookingTypeInfo.color}`}>
                          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[10px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                            {bookingTypeInfo.text}
                          </p>
                        </span>
                      </div>
                      <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                        العميل: {booking.customer?.name || '-'}
                      </p>
                      
                      {/* Venue */}
                      {booking.venue && (
                        <div className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0 w-full mt-[4px]">
                          <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[13px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 500" }}>
                            القاعة:
                          </p>
                          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                            {booking.venue?.nameAr || booking.venue?.name || '-'}
                          </p>
                        </div>
                      )}

                      {/* Services */}
                      {booking.services && booking.services.length > 0 && (
                        <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0 w-full mt-[4px]">
                          <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[13px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 500" }}>
                            الخدمات ({booking.services.length}):
                          </p>
                          {booking.services.map((bookingService, idx) => (
                            <div key={idx} className="content-stretch flex flex-col gap-[2px] items-end relative shrink-0 w-full bg-gray-50 p-[8px] rounded-[8px]">
                              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                                • {bookingService.service?.nameAr || bookingService.service?.name || '-'}
                              </p>
                              {bookingService.locationType && (
                                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[11px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                                  الموقع: {getLocationTypeText(bookingService.locationType)}
                                </p>
                              )}
                              {bookingService.locationAddress && (
                                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[11px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                                  العنوان: {bookingService.locationAddress}
                                </p>
                              )}
                              {bookingService.date && (
                                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[11px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                                  التاريخ: {new Date(bookingService.date).toLocaleDateString('ar-EG')}
                                </p>
                              )}
                              {bookingService.startTime && bookingService.endTime && (
                                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[11px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                                  الوقت: {bookingService.startTime} - {bookingService.endTime}
                                </p>
                              )}
                              {bookingService.price && (
                                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[12px] text-right font-medium" style={{ fontVariationSettings: "'wdth' 100, 'wght' 500" }}>
                                  السعر: {bookingService.price} $
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 mt-[4px]">
                        <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          {new Date(booking.date).toLocaleDateString('ar-EG')} | {booking.finalAmount || booking.totalAmount} $
                        </p>
                      </div>
                    </div>
                    <span className={`px-[12px] py-[4px] rounded-[12px] ${statusInfo.color}`}>
                      <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[12px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                        {statusInfo.text}
                      </p>
                    </span>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-full">
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'CONFIRMED')}
                        className="px-[12px] py-[6px] rounded-[8px] bg-[#28a745] text-white text-[12px]"
                      >
                        تأكيد
                      </button>
                    )}
                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'CANCELLED')}
                        className="px-[12px] py-[6px] rounded-[8px] bg-[#dc3545] text-white text-[12px]"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {bookings.length === 0 && (
              <div className="text-center py-10 text-[#666]">لا توجد نتائج</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBookings




