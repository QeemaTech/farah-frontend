import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

function AddBooking() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    customerName: '',
    bookingType: '',
    description: '',
    date: '',
    paymentStatus: '',
    additionalServices: [],
  })
  const [charCount, setCharCount] = useState(0)

  const handleInputChange = (field, value) => {
    if (field === 'description') {
      setCharCount(value.length)
      if (value.length <= 200) {
        setFormData({ ...formData, [field]: value })
      }
    } else {
      setFormData({ ...formData, [field]: value })
    }
  }

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      <StatusBar />

      {/* Header */}
      <div className="fixed top-[66px] left-1/2 transform -translate-x-1/2 w-full max-w-[390px] flex items-center justify-between px-5 bg-white z-10">
        <div className="w-8 h-8 opacity-0"></div>
        <h1 className="text-lg font-bold text-gray-800">إضافة حجز</h1>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="transform rotate-180"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="pt-[118px] pb-[100px] px-5 flex flex-col gap-4">
        {/* Customer Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            إسم العميل
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            placeholder="أدخل اسم العميل"
            className="border border-[#f2f2f2] rounded-xl px-4 py-3 text-right text-sm outline-none"
            dir="rtl"
          />
        </div>

        {/* Booking Type */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            نوع الحجز
          </label>
          <div className="border border-[#f2f2f2] rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="transform rotate-180"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="#121212"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              value={formData.bookingType}
              onChange={(e) => handleInputChange('bookingType', e.target.value)}
              placeholder="اختر نوع الحجز"
              className="flex-1 text-right text-sm outline-none"
              dir="rtl"
            />
          </div>
        </div>

        {/* Booking Description */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            وصف الحجز
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="أدخل وصف الحجز"
            rows="4"
            maxLength={200}
            className="border border-[#f2f2f2] rounded-xl px-4 py-3 text-right text-sm outline-none resize-none"
            dir="rtl"
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">
              {charCount}/200
            </span>
          </div>
        </div>

        {/* Booking Date */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            تاريخ الحجز
          </label>
          <div className="border border-[#f2f2f2] rounded-xl px-4 py-3 flex items-center justify-between">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="flex-1 text-right text-sm outline-none"
              dir="rtl"
            />
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
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

        {/* Payment Status */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            حالة الدفع
          </label>
          <div className="border border-[#f2f2f2] rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="transform rotate-180"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="#121212"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              value={formData.paymentStatus}
              onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
              placeholder="اختر حالة الدفع"
              className="flex-1 text-right text-sm outline-none"
              dir="rtl"
            />
          </div>
        </div>

        {/* Additional Services */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            خدمات إضافية
          </label>
          <div className="border border-[#f2f2f2] rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M10 4V16M4 10H16"
                stroke="#121212"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="أضف خدمات إضافية"
              className="flex-1 text-right text-sm outline-none"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[393px] bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5">
        <button
          onClick={() => navigate('/booking')}
          className="w-full bg-[#2d2871] text-white rounded-[38px] py-3.5 text-base font-bold"
        >
          التالي
        </button>
        <div className="h-[35px] flex items-center justify-center">
          <div className="w-[134px] h-1 bg-[#4e5868] rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

export default AddBooking




