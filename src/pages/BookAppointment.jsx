import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

function BookAppointment() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const months = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isAvailable: false,
      })
    }
    // Current month days
    const unavailableDates = [1, 2, 11, 14, 18, 23]
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        isAvailable: !unavailableDates.includes(i),
      })
    }
    // Next month days
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        isAvailable: false,
      })
    }
    return days
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      <StatusBar />

      {/* Header */}
      <div className="fixed top-[66px] left-1/2 transform -translate-x-1/2 w-full max-w-[390px] flex items-center justify-between px-5 bg-white z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">حجز موعد</h1>
        <div className="w-8 h-8 opacity-0"></div>
      </div>

      {/* Main Content */}
      <div className="pt-[118px] pb-[100px] px-5 flex flex-col gap-4">
        <p className="text-sm text-gray-600 text-right">
          حدد موعد مناسبتك من الأيام المتاحة
        </p>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={handleNextMonth}>
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
          <h2 className="text-lg font-bold text-gray-800">
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button onClick={handlePrevMonth}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
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

        {/* Calendar Grid */}
        <div className="bg-white border border-[#f2f2f2] rounded-2xl p-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => day.isAvailable && setSelectedDate(day.date)}
                disabled={!day.isAvailable}
                className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                  !day.isCurrentMonth
                    ? 'text-gray-300'
                    : !day.isAvailable
                    ? 'text-gray-300 cursor-not-allowed'
                    : selectedDate === day.date
                    ? 'bg-[#EF92AB] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day.date}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[393px] bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5">
        <button
          onClick={() => navigate('/booking-confirmation')}
          className="w-full bg-[#2d2871] text-white rounded-[38px] py-3.5 text-base font-bold"
        >
          تأكيد الموعد
        </button>
        <div className="h-[35px] flex items-center justify-center">
          <div className="w-[134px] h-1 bg-[#4e5868] rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

export default BookAppointment




