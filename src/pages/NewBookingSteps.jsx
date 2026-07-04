import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import StatusBar from '../components/StatusBar'
import MainHeader from '../components/MainHeader'
import BottomNavigation from '../components/BottomNavigation'
import BookingLocationDrawer from '../components/BookingLocationDrawer'
import SelectServicesDrawer from '../components/SelectServicesDrawer'
import BookAppointmentDrawer from '../components/BookAppointmentDrawer'
import CustomizeVenueDrawer from '../components/CustomizeVenueDrawer'
import AdditionsDrawer from '../components/AdditionsDrawer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function NewBookingSteps() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Get venue data from navigation state
  const venueData = location.state?.venue || location.state?.booking || {}
  
  // Booking data state - stores all collected information
  const [bookingData, setBookingData] = useState({
    venueId: venueData.id || venueData.venueId,
    venueName: venueData.nameAr || venueData.name || venueData.venueName,
    venuePrice: venueData.price || venueData.venuePrice,
    venueImage: Array.isArray(venueData.images) ? venueData.images[0] : (venueData.images || venueData.venueImage),
    venueDescription: venueData.descriptionAr || venueData.description || venueData.venueDescription,
    address: venueData.location || venueData.address || venueData.address,
    // Step 1: Location
    location: null,
    // Step 2: Services
    services: [],
    serviceIds: [],
    // Step 3: Date
    date: null,
    // Step 4: Customization
    customization: null,
    // Step 5: Additions
    additions: [],
  })

  // Current step state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  // Drawer states
  const [showLocationDrawer, setShowLocationDrawer] = useState(false)
  const [showServicesDrawer, setShowServicesDrawer] = useState(false)
  const [showAppointmentDrawer, setShowAppointmentDrawer] = useState(false)
  const [showCustomizeDrawer, setShowCustomizeDrawer] = useState(false)
  const [showAdditionsDrawer, setShowAdditionsDrawer] = useState(false)

  // Check if venue data exists
  useEffect(() => {
    if (!venueData.id && !venueData.venueId) {
      alert('لا توجد معلومات القاعة. سيتم توجيهك للصفحة الرئيسية.')
      navigate('/home')
    }
  }, [])

  // Step handlers
  const handleLocationNext = (locationData) => {
    // locationData can be a string or an object with location, locationAddress, etc.
    if (typeof locationData === 'object') {
      setBookingData(prev => ({ ...prev, ...locationData }))
    } else {
      setBookingData(prev => ({ ...prev, location: locationData }))
    }
    setShowLocationDrawer(false)
    setCurrentStep(2)
    setShowServicesDrawer(true)
  }

  const handleServicesNext = (selectedServices) => {
    // Extract service IDs from selected services
    const serviceIds = selectedServices.map(s => typeof s === 'string' ? s : (s.id || s))
    setBookingData(prev => ({ 
      ...prev, 
      services: selectedServices,
      serviceIds: serviceIds
    }))
    setShowServicesDrawer(false)
    setCurrentStep(3)
    setShowAppointmentDrawer(true)
  }

  const handleAppointmentNext = (selectedDate) => {
    // selectedDate can be a Date object, string, or an object with {date, startTime, endTime}
    setBookingData(prev => ({ 
      ...prev, 
      date: selectedDate,
      // Extract date, startTime, endTime if it's an object
      ...(typeof selectedDate === 'object' && selectedDate !== null && !(selectedDate instanceof Date) && selectedDate.date
        ? {
            date: selectedDate.date,
            startTime: selectedDate.startTime,
            endTime: selectedDate.endTime
          }
        : {})
    }))
    setShowAppointmentDrawer(false)
    setCurrentStep(4)
    setShowCustomizeDrawer(true)
  }

  const handleCustomizeNext = (customization) => {
    setBookingData(prev => ({ ...prev, customization }))
    setShowCustomizeDrawer(false)
    setCurrentStep(5)
    setShowAdditionsDrawer(true)
  }

  // Save booking data to localStorage as backup
  useEffect(() => {
    if (bookingData.venueId) {
      try {
        sessionStorage.setItem('bookingData_backup', JSON.stringify(bookingData))
      } catch (error) {
        // Ignore storage errors
      }
    }
  }, [bookingData])

  // Restore booking data from localStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('bookingData_backup')
      if (saved && !bookingData.venueId) {
        const parsed = JSON.parse(saved)
        if (parsed.venueId) {
          setBookingData(parsed)
        }
      }
    } catch (error) {
      // Ignore storage errors
    }
  }, [])

  const handleAdditionsNext = (additions) => {
    const additionServices = additions.map(id => {
      if (id === 'buffet') return { id: 'buffet', name: 'البوفيه', price: 50, icon: 'buffet' }
      if (id === 'photographers') return { id: 'photographer', name: 'مصور', price: 50, icon: 'camera' }
      if (id === 'beautyExpert') return { id: 'beautyExpert', name: 'خبيرة تجميل', price: 50, icon: 'beauty' }
      return null
    }).filter(Boolean)

    const finalData = {
      ...bookingData,
      additions: additionServices,
      additionalServices: additionServices
    }
    
    // Save to sessionStorage before navigation
    try {
      sessionStorage.setItem('bookingData_backup', JSON.stringify(finalData))
    } catch (error) {
      // Ignore storage errors
    }
    
    setShowAdditionsDrawer(false)
    
    // Use setTimeout to ensure navigation happens after state update completes
    setTimeout(() => {
      navigate('/booking-confirmation', {
        state: { 
          bookingData: finalData
        },
        replace: false
      })
    }, 0)
  }

  const handleAdditionsSkip = () => {
    const finalData = {
      ...bookingData,
      additions: [],
      additionalServices: []
    }
    
    // Save to sessionStorage before navigation
    try {
      sessionStorage.setItem('bookingData_backup', JSON.stringify(finalData))
    } catch (error) {
      // Ignore storage errors
    }
    
    setShowAdditionsDrawer(false)
    
    // Use setTimeout to ensure navigation happens after state update completes
    setTimeout(() => {
      navigate('/booking-confirmation', {
        state: { bookingData: finalData },
        replace: false
      })
    }, 0)
  }

  // Start booking flow
  const startBooking = () => {
    setCurrentStep(1)
    setShowLocationDrawer(true)
  }

  // Calculate progress percentage
  const progress = (currentStep / totalSteps) * 100

  return (
    <>
      <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
        {/* Main Header */}
        <MainHeader />

        {/* Decorative Background */}
        <div className="absolute contents left-[-249px] top-[-335px] pointer-events-none">
          <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
            <div className="h-[342.961px] relative w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[20px] top-[100px] w-[350px] overflow-y-auto pb-[120px]">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#2d2871] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Step Indicator */}
          <div className="w-full text-center">
            <p className="text-sm text-gray-600">
              الخطوة {currentStep} من {totalSteps}
            </p>
          </div>

          {/* Venue Info Card */}
          <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex gap-[16px] items-start overflow-clip p-[10px] relative rounded-[16px] shrink-0 w-full">
            <div className="content-stretch flex flex-[1_0_0] flex-col items-end min-h-px min-w-px relative shrink-0">
              <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[16px] text-right tracking-[0.32px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {bookingData.venueName || 'اسم القاعة'}
              </p>
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#999] text-[12px] tracking-[0.22px] mt-1" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                {bookingData.venueDescription || 'وصف القاعة'}
              </p>
            </div>
            <div className="aspect-[96/96] relative rounded-[13px] self-stretch shrink-0">
              <div className="absolute bg-[#d9d9d9] inset-0 rounded-[13px]"></div>
              <img
                src={bookingData.venueImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'}
                alt={bookingData.venueName}
                className="absolute max-w-none object-cover rounded-[13px] size-full"
              />
            </div>
          </div>

          {/* Current Step Summary */}
          <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[12px] items-end p-[16px] relative rounded-[16px] shrink-0 w-full">
            {currentStep === 1 && !bookingData.location && (
              <div className="w-full text-center py-8">
                <p className="text-gray-600 mb-4">ابدأ عملية الحجز</p>
                <button
                  onClick={startBooking}
                  className="bg-[#2d2871] text-white rounded-[24px] px-6 py-3 font-medium hover:bg-[#1f1a5a] transition-colors"
                >
                  بدء الحجز
                </button>
              </div>
            )}

            {bookingData.location && (
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">الموقع المحدد:</p>
                <p className="text-sm text-gray-600">
                  {bookingData.location === 'artist' ? 'الموقع الخاص بالميكب ارتست' :
                   bookingData.location === 'another' ? 'تحديد موقع آخر (+50$)' :
                   bookingData.location === 'map' ? 'تحديد الموقع علي الخريطة' : ''}
                </p>
              </div>
            )}

            {bookingData.services.length > 0 && (
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">الخدمات المحددة:</p>
                <div className="flex flex-wrap gap-2">
                  {bookingData.services.map((service, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {typeof service === 'string' ? service : (service.nameAr || service.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {bookingData.date && (
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">تاريخ الحجز:</p>
                <div className="text-sm text-gray-600">
                  {(() => {
                    // Handle object with date, startTime, endTime
                    if (typeof bookingData.date === 'object' && bookingData.date !== null && !(bookingData.date instanceof Date)) {
                      const dateObj = bookingData.date
                      const dateValue = dateObj.date instanceof Date 
                        ? dateObj.date 
                        : (typeof dateObj.date === 'string' ? new Date(dateObj.date) : null)
                      
                      if (dateValue) {
                        return (
                          <div>
                            <p>{dateValue.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            {dateObj.startTime && dateObj.endTime && (
                              <p className="text-xs text-gray-500 mt-1">
                                الوقت: {dateObj.startTime} - {dateObj.endTime}
                              </p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }
                    // Handle Date object
                    if (bookingData.date instanceof Date) {
                      return bookingData.date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                    }
                    // Handle string
                    if (typeof bookingData.date === 'string') {
                      try {
                        const date = new Date(bookingData.date)
                        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                      } catch {
                        return bookingData.date
                      }
                    }
                    return null
                  })()}
                </div>
              </div>
            )}

            {bookingData.customization && (
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">التخصيصات:</p>
                <p className="text-sm text-gray-600">تم تحديد التخصيصات</p>
              </div>
            )}

            {bookingData.additions.length > 0 && (
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">الإضافات:</p>
                <div className="flex flex-wrap gap-2">
                  {bookingData.additions.map((addition, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {addition.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {currentStep > 1 && (
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setCurrentStep(prev => prev - 1)
                  // Open appropriate drawer based on step
                  if (currentStep === 2) {
                    setShowLocationDrawer(true)
                    setShowServicesDrawer(false)
                  } else if (currentStep === 3) {
                    setShowServicesDrawer(true)
                    setShowAppointmentDrawer(false)
                  } else if (currentStep === 4) {
                    setShowAppointmentDrawer(true)
                    setShowCustomizeDrawer(false)
                  } else if (currentStep === 5) {
                    setShowCustomizeDrawer(true)
                    setShowAdditionsDrawer(false)
                  }
                }}
                className="flex-1 bg-gray-200 text-gray-700 rounded-[24px] px-6 py-3 font-medium hover:bg-gray-300 transition-colors"
              >
                السابق
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />

      {/* Drawers */}
      <BookingLocationDrawer
        isOpen={showLocationDrawer}
        onClose={() => {
          setShowLocationDrawer(false)
          if (currentStep === 1) {
            navigate(-1)
          }
        }}
        onNext={handleLocationNext}
        selectedLocation={bookingData.location}
        onLocationChange={(location) => setBookingData({ ...bookingData, location })}
        venueData={venueData}
      />

      <SelectServicesDrawer
        isOpen={showServicesDrawer}
        onClose={() => {
          setShowServicesDrawer(false)
          if (currentStep === 2) {
            setCurrentStep(1)
            setShowLocationDrawer(true)
          }
        }}
        onNext={handleServicesNext}
        selectedServices={bookingData.serviceIds}
        onServicesChange={(services) => setBookingData({ ...bookingData, serviceIds: services })}
      />

      <BookAppointmentDrawer
        isOpen={showAppointmentDrawer}
        onClose={() => {
          setShowAppointmentDrawer(false)
          if (currentStep === 3) {
            setCurrentStep(2)
            setShowServicesDrawer(true)
          }
        }}
        onConfirm={handleAppointmentNext}
        selectedDate={bookingData.date}
        onDateChange={(date) => setBookingData({ ...bookingData, date })}
        venueId={bookingData.venueId}
      />

      <CustomizeVenueDrawer
        isOpen={showCustomizeDrawer}
        onClose={() => {
          setShowCustomizeDrawer(false)
          if (currentStep === 4) {
            setCurrentStep(3)
            setShowAppointmentDrawer(true)
          }
        }}
        onNext={handleCustomizeNext}
        customization={bookingData.customization}
        onCustomizationChange={(custom) => setBookingData({ ...bookingData, customization: custom })}
      />

      <AdditionsDrawer
        isOpen={showAdditionsDrawer}
        onClose={() => {
          setShowAdditionsDrawer(false)
          if (currentStep === 5) {
            setCurrentStep(4)
            setShowCustomizeDrawer(true)
          }
        }}
        onContinue={handleAdditionsNext}
        onSkip={handleAdditionsSkip}
        selectedAdditions={bookingData.additions.map(a => a.id)}
        onAdditionsChange={(ids) => {
          const services = ids.map(id => {
            if (id === 'buffet') return { id: 'buffet', name: 'البوفيه', price: 50, icon: 'buffet' }
            if (id === 'photographers') return { id: 'photographer', name: 'مصور', price: 50, icon: 'camera' }
            if (id === 'beautyExpert') return { id: 'beautyExpert', name: 'خبيرة تجميل', price: 50, icon: 'beauty' }
            return null
          }).filter(Boolean)
          setBookingData({ ...bookingData, additions: services })
        }}
      />
    </>
  )
}

export default NewBookingSteps

