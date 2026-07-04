import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import { Clock, X, Pencil, Trash2, Plus } from 'lucide-react'
import { API_URL, getVenueApiConfig, getVenueBookingsApiConfig } from '../utils/adminSession'
import { useLanguage } from '../../contexts/LanguageContext'

function VenueBookingCalendar() {
  const { language } = useLanguage()
  const venueApi = getVenueApiConfig()
  const bookingsApi = getVenueBookingsApiConfig()
  const { id } = useParams()
  const navigate = useNavigate()
  const [venue, setVenue] = useState(null)
  const [calendar, setCalendar] = useState([])
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '', isRecurring: false })

  useEffect(() => {
    fetchCalendar()
  }, [id])

  const fetchCalendar = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)
      const endDateStr = endDate.toISOString().split('T')[0]

      const response = await axios.get(venueApi.calendarUrl(id), {
        headers: venueApi.headers,
        params: { startDate, endDate: endDateStr },
      })

      if (response.data.success) {
        setVenue(response.data.venue)
        setCalendar(response.data.calendar)
        setHolidays(response.data.holidays)
      }
    } catch (error) {
      console.error('Error fetching calendar:', error)
      alert('فشل تحميل التقويم')
    } finally {
      setLoading(false)
    }
  }

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking)
    setShowBookingModal(true)
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return

    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        bookingsApi.statusUrl(bookingId),
        { status: 'CANCELLED' },
        { headers: bookingsApi.statusHeaders || bookingsApi.headers }
      )

      alert('تم إلغاء الحجز بنجاح')
      setShowBookingModal(false)
      fetchCalendar()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('فشل إلغاء الحجز')
    }
  }

  const handleUpdateBooking = async (bookingId, updates) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        bookingsApi.statusUrl(bookingId),
        { status: updates.status || 'CONFIRMED' },
        { headers: bookingsApi.statusHeaders || bookingsApi.headers }
      )

      alert('تم تحديث الحجز بنجاح')
      setShowBookingModal(false)
      fetchCalendar()
    } catch (error) {
      console.error('Error updating booking:', error)
      alert(error.response?.data?.error || 'فشل تحديث الحجز')
    }
  }

  const handleAddHoliday = async () => {
    if (!newHoliday.date) {
      alert('الرجاء اختيار تاريخ')
      return
    }

    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(
        venueApi.holidaysUrl(id),
        newHoliday,
        { headers: venueApi.headers }
      )

      alert('تم إضافة العطلة بنجاح')
      setShowHolidayModal(false)
      setNewHoliday({ date: '', reason: '', isRecurring: false })
      fetchCalendar()
    } catch (error) {
      console.error('Error adding holiday:', error)
      alert(error.response?.data?.error || 'فشل إضافة العطلة')
    }
  }

  const handleDeleteHoliday = async (holidayId) => {
    if (!confirm('هل أنت متأكد من حذف هذه العطلة؟')) return

    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(
        venueApi.deleteHolidayUrl(id, holidayId),
        { headers: venueApi.headers }
      )

      alert('تم حذف العطلة بنجاح')
      fetchCalendar()
    } catch (error) {
      console.error('Error deleting holiday:', error)
      alert('فشل حذف العطلة')
    }
  }

  if (loading) {
    return (
      <AdminPage title={language === 'ar' ? 'تقويم الحجوزات' : 'Booking calendar'} loading>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={language === 'ar' ? 'تقويم الحجوزات' : 'Booking calendar'}
      breadcrumbs={[
        { label: language === 'ar' ? 'القاعات' : 'Venues', path: '/admin/venues' },
        { label: venue?.nameAr || venue?.name || '' },
      ]}
      action={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowHolidayModal(true)} className="ads-btn ads-btn-subtle gap-2">
            <Plus className="h-4 w-4" /> {language === 'ar' ? 'إضافة عطلة' : 'Add holiday'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/admin/venues/${id}/edit`)}
            className="ads-btn ads-btn-primary gap-2"
          >
            <Pencil className="h-4 w-4" /> {language === 'ar' ? 'تعديل القاعة' : 'Edit venue'}
          </button>
          <button type="button" onClick={() => navigate('/admin/venues')} className="ads-btn ads-btn-subtle">
            {language === 'ar' ? 'رجوع' : 'Back'}
          </button>
        </div>
      }
    >
      <div>
        {/* Working Hours Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock className="h-4 w-4" />
            <span className="font-medium">ساعات العمل:</span>
            <span>{venue?.workingHours?.start || '09:00'} - {venue?.workingHours?.end || '22:00'}</span>
          </div>
        </div>

        {/* Holidays List */}
        {holidays.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-red-800 mb-2">العطلات:</h3>
            <div className="flex flex-wrap gap-2">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-red-200"
                >
                  <span className="text-sm text-gray-700">{holiday.date}</span>
                  {holiday.reason && (
                    <span className="text-xs text-gray-500">({holiday.reason})</span>
                  )}
                  <button
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {/* Header */}
            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => (
              <div key={day} className="bg-gray-100 p-3 text-center font-bold text-gray-700">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendar.map((day, idx) => {
              const date = new Date(day.date)
              const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
              
              return (
                <div
                  key={idx}
                  className={`bg-white p-3 min-h-[120px] border-r border-b border-gray-200 ${
                    day.isHoliday ? 'bg-red-50' : ''
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${day.isHoliday ? 'text-red-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </span>
                    {day.isHoliday && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        عطلة
                      </span>
                    )}
                  </div>

                  {/* Bookings */}
                  <div className="space-y-1">
                    {day.bookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => handleBookingClick(booking)}
                        className="w-full text-left bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded transition-colors"
                      >
                        <div className="font-medium">{booking.startTime} - {booking.endTime}</div>
                        <div className="text-xs opacity-75">
                          {booking.customer?.nameAr || booking.customer?.name}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Available/Total Slots */}
                  <div className="mt-2 text-xs text-gray-500">
                    {day.availableSlots}/{day.totalSlots} متاح
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => {
            setShowBookingModal(false)
            setSelectedBooking(null)
          }}
          onCancel={handleCancelBooking}
          onUpdate={handleUpdateBooking}
        />
      )}

      {/* Add Holiday Modal */}
      {showHolidayModal && (
        <HolidayModal
          holiday={newHoliday}
          onChange={setNewHoliday}
          onClose={() => {
            setShowHolidayModal(false)
            setNewHoliday({ date: '', reason: '', isRecurring: false })
          }}
          onSave={handleAddHoliday}
        />
      )}
    </AdminPage>
  )
}

// Booking Modal Component
function BookingModal({ booking, onClose, onCancel, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    date: booking.date ? new Date(booking.date).toISOString().split('T')[0] : '',
    startTime: booking.startTime || '',
    endTime: booking.endTime || '',
    totalAmount: booking.totalAmount || 0,
    discount: booking.discount || 0,
    notes: booking.notes || '',
  })

  const handleSave = () => {
    onUpdate(booking.id, formData)
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">تفاصيل الحجز</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2">معلومات العميل</h3>
              <p className="text-sm text-gray-600">
                {booking.customer?.nameAr || booking.customer?.name}
              </p>
              <p className="text-sm text-gray-600">{booking.customer?.phone}</p>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    {booking.date ? new Date(booking.date).toLocaleDateString('ar-EG') : '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوقت</label>
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {booking.startTime && booking.endTime
                      ? `${booking.startTime} - ${booking.endTime}`
                      : '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الإجمالي</label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-sm text-gray-600">{booking.totalAmount?.toFixed(2) || 0} $</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-sm text-gray-600">{booking.discount?.toFixed(2) || 0} $</p>
                )}
              </div>
            </div>

            {/* Services */}
            {booking.services && booking.services.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الخدمات</label>
                <div className="space-y-1">
                  {booking.services.map((bs, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      {bs.service?.nameAr || bs.service?.name} - {bs.price || 0} $
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              {editing ? (
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-600">{booking.notes || '-'}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ التغييرات
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Pencil className="inline mr-2 h-4 w-4" />
                  تعديل
                </button>
                <button
                  onClick={() => onCancel(booking.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="inline mr-2 h-4 w-4" />
                  إلغاء الحجز
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Holiday Modal Component
function HolidayModal({ holiday, onChange, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">إضافة عطلة</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
              <input
                type="date"
                value={holiday.date}
                onChange={(e) => onChange({ ...holiday, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السبب (اختياري)</label>
              <input
                type="text"
                value={holiday.reason}
                onChange={(e) => onChange({ ...holiday, reason: e.target.value })}
                placeholder="مثال: عيد الفطر"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={holiday.isRecurring}
                onChange={(e) => onChange({ ...holiday, isRecurring: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isRecurring" className="text-sm text-gray-700">
                عطلة متكررة سنوياً
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onSave}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              حفظ
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VenueBookingCalendar

