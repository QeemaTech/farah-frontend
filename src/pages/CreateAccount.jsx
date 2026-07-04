import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

function CreateAccount() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    startHours: '',
    endHours: '',
    workingDays: [],
  })

  const days = [
    'السبت',
    'الأحد',
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
  ]

  const toggleDay = (day) => {
    setFormData({
      ...formData,
      workingDays: formData.workingDays.includes(day)
        ? formData.workingDays.filter((d) => d !== day)
        : [...formData.workingDays, day],
    })
  }

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      <StatusBar />

      {/* Header */}
      <div className="fixed top-[66px] left-1/2 transform -translate-x-1/2 w-full max-w-[390px] flex items-center justify-between px-5 bg-white z-10">
        <div className="w-8 h-8 opacity-0"></div>
        <h1 className="text-lg font-bold text-gray-800">إنشاء حساب</h1>
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
        {/* Venue Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            اسم القاعة
          </label>
          <input
            type="text"
            value={formData.venueName}
            onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
            placeholder="أدخل اسم القاعة"
            className="border border-[#f2f2f2] rounded-xl px-4 py-3 text-right text-sm outline-none"
            dir="rtl"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            الإيميل
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="أدخل الإيميل"
            className="border border-[#f2f2f2] rounded-xl px-4 py-3 text-right text-sm outline-none"
            dir="rtl"
          />
        </div>

        {/* Working Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right">
              بداية ساعات العمل
            </label>
            <input
              type="time"
              value={formData.startHours}
              onChange={(e) => setFormData({ ...formData, startHours: e.target.value })}
              className="border border-[#f2f2f2] rounded-xl px-4 py-3 text-right text-sm outline-none"
              dir="rtl"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 text-right">
              نهاية ساعات العمل
            </label>
            <input
              type="time"
              value={formData.endHours}
              onChange={(e) => setFormData({ ...formData, endHours: e.target.value })}
              className="border border-[#f2f2f2] rounded-xl px-4 py-3 text-right text-sm outline-none"
              dir="rtl"
            />
          </div>
        </div>

        {/* Working Days */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 text-right">
            أيام العمل
          </label>
          <div className="grid grid-cols-4 gap-3">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`border rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  formData.workingDays.includes(day)
                    ? 'bg-[#2d2871] text-white border-[#2d2871]'
                    : 'border-[#f2f2f2] text-gray-700'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[393px] bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5">
        <button
          onClick={() => navigate('/home')}
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

export default CreateAccount




