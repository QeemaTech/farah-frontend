import { useNavigate, useLocation } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

function BookingSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const booking = location.state?.booking || {}
  const bookingNumber = location.state?.bookingNumber || booking.bookingNumber || '#12345'

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative flex flex-col items-center justify-center px-5">
      {/* Status Bar */}
      <StatusBar />

      {/* Success Content */}
      <div className="flex flex-col items-center gap-6 text-center relative">
        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-16 h-16 bg-purple-200 rounded-full opacity-30 blur-xl"></div>
          <div className="absolute top-10 right-10 w-12 h-12 bg-pink-200 rounded-full opacity-30 blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-10 h-10 bg-purple-300 rounded-full opacity-20 blur-xl"></div>
        </div>

        {/* Success Icon */}
        <div className="relative z-10 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              className="text-purple-600"
            >
              <path
                d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4ZM19.5 32.5L10.5 23.5L13.06 20.94L19.5 27.36L34.94 12L37.5 14.56L19.5 32.5Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="flex flex-col gap-2 relative z-10">
          <h1 className="text-2xl font-bold text-gray-800">تم تأكيد الحجز</h1>
          <p className="text-sm text-gray-600">
            يمكنك تغيير او الغاء الحجز بكل سهولة
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white border border-[#f2f2f2] rounded-2xl p-4 w-full flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">رقم الحجز</span>
            <span className="text-sm font-bold text-gray-800">{bookingNumber}</span>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">تاريخ الحجز</span>
            <span className="text-sm text-gray-800">
              {booking.date ? new Date(booking.date).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')}
            </span>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">المبلغ المدفوع</span>
            <span className="text-sm font-bold text-gray-800">
              {booking.totalAmount ? `${booking.totalAmount.toFixed(2)} ر.س` : '—'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3 w-full relative z-10">
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-[#2d2871] text-white rounded-[38px] py-3.5 text-base font-bold hover:bg-[#1f1a5a] transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingSuccess



