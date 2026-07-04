import { useState, useEffect } from 'react'
import Drawer from './Drawer'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function BookAppointmentDrawer({ isOpen, onClose, onConfirm, selectedDate, onDateChange, venueId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selected, setSelected] = useState(selectedDate || null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [bookedDates, setBookedDates] = useState([])
  const [fullyBookedDates, setFullyBookedDates] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [showTimeSlots, setShowTimeSlots] = useState(false)

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
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
    
    // Add previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthDays - i)
      })
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = new Date(year, month, i)
      const dateStr = fullDate.toISOString().split('T')[0]
      const isBooked = bookedDates.includes(dateStr)
      const isFullyBooked = fullyBookedDates.includes(dateStr)
      const isPast = fullDate < new Date().setHours(0, 0, 0, 0)
      
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: fullDate,
        isDisabled: isPast || isFullyBooked,
        isBooked: isBooked,
        isFullyBooked: isFullyBooked,
      })
    }

    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i)
      })
    }

    return days
  }

  // Update selected when selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      // Handle object with date, startTime, endTime
      if (typeof selectedDate === 'object' && selectedDate !== null && !(selectedDate instanceof Date) && selectedDate.date) {
        setSelected(selectedDate.date instanceof Date ? selectedDate.date : new Date(selectedDate.date))
        // Set time slot if provided
        if (selectedDate.startTime && selectedDate.endTime) {
          setSelectedTimeSlot({
            start: selectedDate.startTime,
            end: selectedDate.endTime,
            available: true
          })
        }
      } else {
        setSelected(selectedDate instanceof Date ? selectedDate : (typeof selectedDate === 'string' ? new Date(selectedDate) : null))
        setSelectedTimeSlot(null)
      }
    } else {
      setSelected(null)
      setSelectedTimeSlot(null)
    }
  }, [selectedDate])

  // Fetch booked dates when drawer opens
  useEffect(() => {
    if (isOpen && venueId) {
      fetchBookedDates()
    }
  }, [isOpen, venueId])

  // Fetch available time slots when date is selected
  useEffect(() => {
    if (selected && venueId) {
      fetchAvailableSlots()
    }
  }, [selected, venueId])

  const fetchBookedDates = async () => {
    try {
      const response = await axios.get(`${API_URL}/mobile/venues/${venueId}/booked-dates`)
      if (response.data.success) {
        setBookedDates(response.data.bookedDates || [])
        setFullyBookedDates(response.data.fullyBookedDates || [])
      }
    } catch (error) {
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selected) return
    
    try {
      setLoadingSlots(true)
      const dateStr = selected.toISOString().split('T')[0]
      const response = await axios.get(`${API_URL}/mobile/venues/${venueId}/available-slots?date=${dateStr}`)
      if (response.data.success) {
        const slots = response.data.slots || []
        setAvailableSlots(slots)
        
        // Check if day is fully booked
        const hasAvailableSlots = slots.some(slot => slot.available)
        if (!hasAvailableSlots && slots.length > 0) {
          alert('هذا اليوم محجوز بالكامل. يرجى اختيار يوم آخر.')
          setSelected(null)
          setShowTimeSlots(false)
          return
        }
        
        setShowTimeSlots(true)
      }
    } catch (error) {
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateSelect = (day) => {
    if (day.isCurrentMonth && !day.isDisabled) {
      const dateStr = day.fullDate.toISOString().split('T')[0]
      
      // Check if date is fully booked
      if (fullyBookedDates.includes(dateStr)) {
        alert('هذا اليوم محجوز بالكامل. يرجى اختيار يوم آخر.')
        return
      }
      
      setSelected(day.fullDate)
      setSelectedTimeSlot(null)
      setShowTimeSlots(false)
      if (onDateChange) {
        onDateChange(day.fullDate)
      }
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleTimeSlotSelect = (slot) => {
    if (slot.available) {
      setSelectedTimeSlot(slot)
    }
  }

  const handleConfirm = () => {
    if (selected && selectedTimeSlot && onConfirm) {
      onConfirm({
        date: selected,
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
      })
    } else if (selected && !showTimeSlots && onConfirm) {
      // If no time slots shown yet, just confirm date
      onConfirm(selected)
    }
  }

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="حجز موعد">
      <div className="flex flex-col gap-4 pb-20">
        <p className="text-sm text-gray-600 text-center">
          حدد موعد مناسبتك من الأيام المتاحة
        </p>

        {/* Calendar Header */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18L9 12L15 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h3 className="text-lg font-bold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 px-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 px-2">
          {days.map((day, idx) => {
            const isSelectedDay = isSameDay(selected, day.fullDate)
            const isToday = isSameDay(day.fullDate, new Date())
            
            return (
              <button
                key={idx}
                onClick={() => handleDateSelect(day)}
                disabled={!day.isCurrentMonth || day.isDisabled}
                className={`
                  aspect-square rounded-lg text-sm font-medium transition-colors
                  ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                  ${day.isDisabled ? 'opacity-50 cursor-not-allowed bg-red-50' : 'cursor-pointer'}
                  ${day.isFullyBooked ? 'bg-red-100 line-through' : ''}
                  ${isSelectedDay ? 'bg-[#2d2871] text-white' : ''}
                  ${!isSelectedDay && day.isCurrentMonth && !day.isDisabled ? 'hover:bg-gray-100' : ''}
                  ${isToday && !isSelectedDay && !day.isDisabled ? 'border-2 border-[#2d2871]' : ''}
                `}
              >
                {day.date}
              </button>
            )
          })}
        </div>

        {/* Time Slots Selection */}
        {showTimeSlots && selected && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3 text-center">
              اختر الوقت المتاح
            </p>
            {loadingSlots ? (
              <div className="text-center py-4 text-gray-500">جاري تحميل الأوقات المتاحة...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4 text-red-500">لا توجد أوقات متاحة في هذا اليوم</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTimeSlotSelect(slot)}
                    disabled={!slot.available}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${selectedTimeSlot?.start === slot.start && selectedTimeSlot?.end === slot.end
                        ? 'bg-[#2d2871] text-white'
                        : slot.available
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                      }
                    `}
                  >
                    {slot.start} - {slot.end}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="sticky bottom-0 bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5 border-t border-gray-100 mt-4">
        <button
          onClick={handleConfirm}
          disabled={!selected || (showTimeSlots && !selectedTimeSlot)}
          className={`w-full rounded-[38px] py-3.5 text-base font-bold transition-colors ${
            selected && (!showTimeSlots || selectedTimeSlot)
              ? 'bg-[#2d2871] text-white hover:bg-[#1f1a5a]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {showTimeSlots && !selectedTimeSlot ? 'اختر الوقت أولاً' : 'تأكيد الموعد'}
        </button>
      </div>
    </Drawer>
  )
}

export default BookAppointmentDrawer

