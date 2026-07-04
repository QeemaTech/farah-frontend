import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import MainHeader from '../components/MainHeader'
import BottomNavigation from '../components/BottomNavigation'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function ServiceBooking() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Get service data from navigation state
  const serviceData = location.state?.service || location.state?.services?.[0] || {}
  const services = location.state?.services || (serviceData.id ? [serviceData] : [])
  
  // Booking data state
  const [bookingData, setBookingData] = useState({
    serviceIds: services.map(s => s.id),
    services: services,
    date: null,
    startTime: null,
    endTime: null,
    location: null,
    locationAddress: '',
    locationLatitude: null,
    locationLongitude: null,
    notes: '',
    guestCount: 1,
  })
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Check if service data exists
  useEffect(() => {
    if (!serviceData.id && services.length === 0) {
      alert('لا توجد معلومات الخدمة. سيتم توجيهك للصفحة الرئيسية.')
      navigate('/services')
    }
  }, [])

  const handleDateSelect = (date) => {
    setBookingData(prev => ({ ...prev, date }))
    setCurrentStep(2)
  }

  const handleTimeSelect = (startTime, endTime) => {
    setBookingData(prev => ({ ...prev, startTime, endTime }))
    setCurrentStep(3)
  }

  const handleLocationSelect = (locationData) => {
    setBookingData(prev => ({
      ...prev,
      location: locationData.location || 'home',
      locationAddress: locationData.address || '',
      locationLatitude: locationData.latitude || null,
      locationLongitude: locationData.longitude || null,
    }))
    setCurrentStep(4)
  }

  const handleNotesChange = (notes) => {
    setBookingData(prev => ({ ...prev, notes }))
  }

  const calculateTotal = () => {
    const servicesTotal = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
    return servicesTotal
  }

  const handleConfirm = () => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً')
      navigate('/login')
      return
    }

    if (!bookingData.date) {
      alert('يجب اختيار التاريخ')
      return
    }

    // Navigate to booking confirmation
    navigate('/booking-confirmation', {
      state: {
        bookingData: {
          ...bookingData,
          serviceIds: bookingData.serviceIds || services.map(s => s.id),
          services: services,
          totalAmount: calculateTotal(),
          // No venueId for standalone service booking
        }
      }
    })
  }

  const service = serviceData
  const serviceImage = service.images && Array.isArray(service.images) && service.images.length > 0
    ? formatImageSrc(service.images[0])
    : (service.image ? formatImageSrc(service.image) : null)

  return (
    <>
      <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
        <StatusBar />
        <MainHeader />

        {/* Service Info */}
        <div className="px-5 pt-28 pb-32">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            {serviceImage && (
              <img 
                src={serviceImage} 
                alt={service.nameAr || service.name}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}
            <h2 className="text-xl font-bold text-right mb-2">
              {service.nameAr || service.name}
            </h2>
            {service.descriptionAr || service.description ? (
              <p className="text-gray-600 text-right text-sm mb-2">
                {service.descriptionAr || service.description}
              </p>
            ) : null}
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold text-[#2d2871]">
                {service.price?.toFixed(2) || '0.00'} ر.س
              </span>
            </div>
          </div>

          {/* Booking Steps */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-right mb-4">اختر التاريخ</h3>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-right"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-right mb-4">اختر الوقت</h3>
              <div className="grid grid-cols-2 gap-3">
                {['09:00', '12:00', '15:00', '18:00', '21:00'].map((time) => (
                  <button
                    key={time}
                    onClick={() => {
                      const [hours, minutes] = time.split(':')
                      const endHours = (parseInt(hours) + 2) % 24
                      handleTimeSelect(time, `${endHours.toString().padStart(2, '0')}:${minutes}`)
                    }}
                    className="p-3 border border-gray-300 rounded-xl hover:bg-[#2d2871] hover:text-white transition"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-right mb-4">اختر الموقع</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleLocationSelect({ location: 'home', address: 'في المنزل' })}
                  className="w-full p-4 border border-gray-300 rounded-xl text-right hover:bg-gray-50"
                >
                  في المنزل
                </button>
                <button
                  onClick={() => handleLocationSelect({ location: 'hotel', address: 'في الفندق' })}
                  className="w-full p-4 border border-gray-300 rounded-xl text-right hover:bg-gray-50"
                >
                  في الفندق
                </button>
                <button
                  onClick={() => handleLocationSelect({ location: 'outdoor', address: 'في الهواء الطلق' })}
                  className="w-full p-4 border border-gray-300 rounded-xl text-right hover:bg-gray-50"
                >
                  في الهواء الطلق
                </button>
                <button
                  onClick={() => {
                    const address = prompt('أدخل العنوان:')
                    if (address) {
                      handleLocationSelect({ location: 'other', address })
                    }
                  }}
                  className="w-full p-4 border border-gray-300 rounded-xl text-right hover:bg-gray-50"
                >
                  موقع آخر
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-right mb-4">ملاحظات إضافية</h3>
              <textarea
                value={bookingData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="أضف أي ملاحظات أو طلبات خاصة..."
                className="w-full p-3 border border-gray-300 rounded-xl text-right min-h-[100px]"
              />
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">المجموع:</span>
                  <span className="text-xl font-bold text-[#2d2871]">
                    {calculateTotal().toFixed(2)} ر.س
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full bg-[#2d2871] text-white py-4 rounded-xl font-bold text-lg"
              >
                تأكيد الحجز
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="mt-4 text-[#2d2871] font-bold"
            >
              ← السابق
            </button>
          )}
        </div>
      </div>
      <BottomNavigation />
    </>
  )
}

export default ServiceBooking

