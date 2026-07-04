import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import MainHeader from '../components/MainHeader'
import BottomNavigation from '../components/BottomNavigation'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function ServiceDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  const fetchedServiceIdRef = useRef(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Only fetch if service ID changed and we're not already fetching
    if (fetchedServiceIdRef.current === id || fetchingRef.current || !id) {
      return
    }

    fetchServiceDetails()
  }, [id])

  const fetchServiceDetails = async () => {
    if (fetchingRef.current || !id) return
    
    fetchingRef.current = true
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/mobile/services/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      })
      setService(response.data.service)
      setIsFavorite(response.data.service?.isFavorite || false)
      fetchedServiceIdRef.current = id
    } catch (error) {
      // Silently fail if backend is not available
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error('Error fetching service details:', error)
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const handleBook = () => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً')
      navigate('/login')
      return
    }

    // Navigate to service booking page
    navigate('/booking/service', {
      state: {
        service: service,
        serviceIds: [service.id],
        services: [service]
      }
    })
  }

  if (loading) {
    return (
      <>
        <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
          <div className="text-center">جاري التحميل...</div>
        </div>
        <BottomNavigation />
      </>
    )
  }

  if (!service) {
    return (
      <>
        <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
          <div className="text-center">الخدمة غير موجودة</div>
        </div>
        <BottomNavigation />
      </>
    )
  }

  const serviceImages = service.images && Array.isArray(service.images) && service.images.length > 0
    ? service.images
    : (service.image ? [service.image] : [])
  
  const serviceImage = serviceImages.length > 0 
    ? formatImageSrc(serviceImages[selectedImageIndex], 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800')
    : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'
  
  const serviceName = service.nameAr || service.name || 'خدمة'
  const serviceDescription = service.descriptionAr || service.description || ''
  const servicePrice = service.price || 0
  const serviceLocation = service.location || service.address || service.provider?.location || ''
  const serviceRating = service.rating || 0
  const serviceReviewCount = service.reviewCount || 0

  return (

    <>
    
    
    <div className="bg-white overflow-y-auto overflow-x-hidden relative w-full min-h-screen mx-auto pb-32 md:pb-0">
        {/* Mobile-only components */}
        <div className="max-w-[390px] mx-auto md:hidden">
          <MainHeader />
        </div>
        
        {/* Desktop header */}
        <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>رجوع</span>
            </button>
            <h1 className="text-xl font-bold text-center flex-1">{serviceName}</h1>
            <div className="w-24"></div>
          </div>
        </div>
        
        <div className="max-w-[390px] md:max-w-7xl mx-auto pt-28 md:pt-0">

        {/* Service Image Gallery */}
        <div className="relative w-full h-[300px] md:h-[500px] bg-gray-100">
          {serviceImages.length > 0 ? (
            <>
              <img
                src={serviceImage}
                alt={serviceName}
                className="w-full h-full object-cover"
              />
              {serviceImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {serviceImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl">📷</span>
            </div>
          )}
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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

        {/* Service Info */}
        <div className="px-5 md:px-8 pt-6 pb-32 md:pb-8">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-8">
            {/* Left Column - Image */}
            <div className="space-y-4">
              <div className="relative w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden">
                {serviceImages.length > 0 ? (
                  <img
                    src={serviceImage}
                    alt={serviceName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-6xl">📷</span>
                  </div>
                )}
              </div>
              {serviceImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {serviceImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-24 rounded-lg overflow-hidden border-2 ${
                        index === selectedImageIndex ? 'border-[#2d2871]' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={formatImageSrc(img)}
                        alt={`${serviceName} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right Column - Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-right mb-2">{serviceName}</h1>
                {service.category && (
                  <p className="text-gray-500 text-right text-lg mb-4">
                    {service.category.nameAr || service.category.name}
                  </p>
                )}
                <div className="flex items-center justify-end gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 0L10.1631 5.52786L16 6.11146L11.8541 9.94428L13.0557 16L8 12.5279L2.94427 16L4.1459 9.94428L0 6.11146L5.83686 5.52786L8 0Z"
                          fill={i < Math.round(serviceRating) ? "#FFD700" : "#E0E0E0"}
                        />
                      </svg>
                    ))}
                  </div>
                  <span className="text-lg text-gray-600">
                    {serviceRating.toFixed(1)} ({serviceReviewCount} تقييم)
                  </span>
                </div>
                <div className="text-right mb-6">
                  <p className="text-3xl font-bold text-[#2d2871]">
                    {servicePrice.toFixed(2)} ر.س
                  </p>
                  {service.pricePerHour && (
                    <p className="text-lg text-gray-500">
                      {service.pricePerHour.toFixed(2)} ر.س/ساعة
                    </p>
                  )}
                </div>
              </div>

              {serviceDescription && (
                <div>
                  <h2 className="text-xl font-bold text-right mb-3">الوصف</h2>
                  <p className="text-gray-600 text-right leading-relaxed text-lg">{serviceDescription}</p>
                </div>
              )}

              {serviceLocation && (
                <div>
                  <h2 className="text-xl font-bold text-right mb-3">الموقع</h2>
                  <div className="flex items-center justify-end gap-2">
                    <svg width="20" height="20" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M5 5C5.82843 5 6.5 4.32843 6.5 3.5C6.5 2.67157 5.82843 2 5 2C4.17157 2 3.5 2.67157 3.5 3.5C3.5 4.32843 4.17157 5 5 5Z"
                        stroke="#999"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <p className="text-gray-600 text-right text-lg">{serviceLocation}</p>
                  </div>
                </div>
              )}

              {service.provider && (
                <div>
                  <h2 className="text-xl font-bold text-right mb-3">مقدم الخدمة</h2>
                  <div className="flex items-center justify-end gap-3">
                    {service.provider.avatar && (
                      <img
                        src={formatImageSrc(service.provider.avatar)}
                        alt={service.provider.nameAr || service.provider.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="text-right">
                      <p className="font-semibold text-lg">{service.provider.nameAr || service.provider.name}</p>
                      {service.provider.phone && (
                        <p className="text-gray-500">{service.provider.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-right mb-3">مميزات الخدمة</h2>
                <div className="space-y-3">
                  {service.worksInVenues && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-right text-lg">تعمل في القاعات</span>
                    </div>
                  )}
                  {service.worksExternal && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-right text-lg">تعمل خارج القاعات</span>
                    </div>
                  )}
                  {service.workingHoursStart && service.workingHoursEnd && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-right text-lg">
                        ساعات العمل: {service.workingHoursStart} - {service.workingHoursEnd}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleBook}
                className="w-full bg-[#2d2871] text-white py-4 rounded-xl font-bold text-xl hover:bg-[#1f1a5a] transition-colors"
              >
                احجز الآن
              </button>
            </div>
          </div>
          
          {/* Mobile Layout */}
          <div className="md:hidden">
          {/* Service Name and Rating */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-right mb-2">{serviceName}</h1>
              {service.category && (
                <p className="text-gray-500 text-right text-sm mb-2">
                  {service.category.nameAr || service.category.name}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 0L10.1631 5.52786L16 6.11146L11.8541 9.94428L13.0557 16L8 12.5279L2.94427 16L4.1459 9.94428L0 6.11146L5.83686 5.52786L8 0Z"
                        fill={i < Math.round(serviceRating) ? "#FFD700" : "#E0E0E0"}
                      />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {serviceRating.toFixed(1)} ({serviceReviewCount} تقييم)
                </span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-[#2d2871]">
                {servicePrice.toFixed(2)} ر.س
              </p>
              {service.pricePerHour && (
                <p className="text-sm text-gray-500">
                  {service.pricePerHour.toFixed(2)} ر.س/ساعة
                </p>
              )}
            </div>
          </div>

          {/* Service Description */}
          {serviceDescription && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-right mb-2">الوصف</h2>
              <p className="text-gray-600 text-right leading-relaxed">{serviceDescription}</p>
            </div>
          )}

          {/* Service Location */}
          {serviceLocation && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-right mb-2">الموقع</h2>
              <div className="flex items-center justify-end gap-2">
                <svg width="16" height="16" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5 5C5.82843 5 6.5 4.32843 6.5 3.5C6.5 2.67157 5.82843 2 5 2C4.17157 2 3.5 2.67157 3.5 3.5C3.5 4.32843 4.17157 5 5 5Z"
                    stroke="#999"
                    strokeWidth="1.5"
                  />
                </svg>
                <p className="text-gray-600 text-right">{serviceLocation}</p>
              </div>
            </div>
          )}

          {/* Provider Info */}
          {service.provider && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-right mb-2">مقدم الخدمة</h2>
              <div className="flex items-center justify-end gap-3">
                {service.provider.avatar && (
                  <img
                    src={formatImageSrc(service.provider.avatar)}
                    alt={service.provider.nameAr || service.provider.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div className="text-right">
                  <p className="font-semibold">{service.provider.nameAr || service.provider.name}</p>
                  {service.provider.phone && (
                    <p className="text-sm text-gray-500">{service.provider.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Service Features */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-right mb-3">مميزات الخدمة</h2>
            <div className="space-y-2">
              {service.worksInVenues && (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-right">تعمل في القاعات</span>
                </div>
              )}
              {service.worksExternal && (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-right">تعمل خارج القاعات</span>
                </div>
              )}
              {service.workingHoursStart && service.workingHoursEnd && (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-right">
                    ساعات العمل: {service.workingHoursStart} - {service.workingHoursEnd}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Book Button */}
          <button
            onClick={handleBook}
            className="w-full bg-[#2d2871] text-white py-4 rounded-xl font-bold text-lg mb-4"
          >
            احجز الآن
          </button>
          </div>
        </div>
        </div>
      </div>
    
 
        <BottomNavigation />
    </>
  )
}

export default ServiceDetails

