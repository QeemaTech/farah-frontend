import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'
import MainHeader from '../components/MainHeader'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Services() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/mobile/categories`)
      const categoriesData = response.data.categories || response.data.data?.categories || []
      setCategories(categoriesData)
    } catch (error) {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const fetchServicesByCategory = async (categoryId) => {
    try {
      setServicesLoading(true)
      const response = await axios.get(`${API_URL}/mobile/services`, {
        params: { categoryId, limit: 50 }
      })
      // Handle different response formats
      const servicesData = response.data.services || response.data.data?.services || response.data || []
      setServices(Array.isArray(servicesData) ? servicesData : [])
    } catch (error) {
      console.error('Error fetching services:', error)
      setServices([])
    } finally {
      setServicesLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
    fetchServicesByCategory(category.id)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setServices([])
  }

  return (
    <>
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
    

      {/* Main Header */}
      <MainHeader />
      

      {/* Decorative Background */}
      <div className="absolute contents left-[-249px] top-[-205px] pointer-events-none">
        <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
          <div className="h-[342.961px] relative w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Page Title */}
      <div className="absolute content-stretch flex items-center justify-between left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-10">
        {selectedCategory ? (
          <button
            onClick={handleBackToCategories}
            className="flex items-center justify-center relative shrink-0 size-[32px]"
          >
            <div className="flex-none rotate-[180deg] scale-y-[-100%]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="#121212"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ) : (
          <div className="w-[32px]"></div>
        )}
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          {selectedCategory ? (selectedCategory.nameAr || selectedCategory.name) : 'الخدمات'}
        </p>
        <div className="w-[32px]"></div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[20px] top-[132px] w-[350px] overflow-y-auto pb-[100px]">
        {!selectedCategory ? (
          <>
            {/* Service Categories */}
            <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
              {loading ? (
                <div className="text-center py-10 text-gray-500">جاري التحميل...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10 text-gray-500">لا توجد فئات متاحة</div>
              ) : (
                categories.map((category) => {
                  const serviceCount = category._count?.services || 0
                  const imageSrc = formatImageSrc(category.image)
                  
                  return (
                    <div
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className="bg-white content-stretch flex h-[80px] items-center justify-between p-[16px] relative rounded-[10px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.07)] shrink-0 w-full cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="content-stretch flex items-center justify-center relative shrink-0 w-[80px]">
                        <div className="relative shrink-0 size-[80px] bg-gray-100 rounded overflow-hidden">
                          {imageSrc ? (
                            <img 
                              src={imageSrc} 
                              alt={category.nameAr || category.name} 
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error('Category image error:', category.id, category.image, imageSrc)
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-gray-400 text-sm">لا توجد صورة</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[4px] items-end justify-center leading-[1.5] relative shrink-0 text-[12px] text-right">
                        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] relative shrink-0 text-[#121212]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                          {category.nameAr || category.name}
                        </p>
                        <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-[#666]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          +{serviceCount} {serviceCount === 1 ? 'خدمة' : 'خدمات'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        ) : (
          <>
            {/* Services List */}
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
              {servicesLoading ? (
                <div className="text-center py-10 text-gray-500 w-full">جاري التحميل...</div>
              ) : services.length === 0 ? (
                <div className="text-center py-10 text-gray-500 w-full">لا توجد خدمات متاحة في هذه الفئة</div>
              ) : (
                services.map((service) => {
                  const images = Array.isArray(service.images) ? service.images : (service.images ? [service.images] : [])
                  const imageSrc = images.length > 0 ? formatImageSrc(images[0]) : null
                  
                  return (
                    <div
                      key={service.id}
                      onClick={() => {
                        // Navigate to service details page
                        navigate(`/service/${service.id}`)
                      }}
                      className="bg-white border border-[#f2f2f2] border-solid content-stretch flex gap-[16px] items-start justify-end overflow-clip p-[12px] relative rounded-[16px] shrink-0 w-full cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-end min-h-px min-w-px relative shrink-0">
                        <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                          <div className="content-stretch flex flex-col gap-[4px] items-end justify-center relative shrink-0">
                            <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                              {service.nameAr || service.name}
                            </p>
                            <div className="content-stretch flex flex-col font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] gap-[4px] items-end justify-center leading-[1.2] relative shrink-0 text-[#999] text-[11px] tracking-[0.22px] w-full">
                              <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                                {service.descriptionAr || service.description || ''}
                              </p>
                              <p className="relative shrink-0 text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                                {service.location || service.provider?.location || ''}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0">
                          <p className="font-['Poppins:Medium',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[12px] text-[rgba(35,31,32,0.86)] tracking-[0.24px]">
                            {service.rating ? service.rating.toFixed(1) : '0.0'}
                          </p>
                          {[...Array(5)].map((_, i) => {
                            const rating = service.rating || 0
                            const filled = i < Math.round(rating)
                            return (
                              <div key={i} className="flex items-center justify-center relative shrink-0">
                                <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path
                                      d="M8 0L10.1631 5.52786L16 6.11146L11.8541 9.94428L13.0557 16L8 12.5279L2.94427 16L4.1459 9.94428L0 6.11146L5.83686 5.52786L8 0Z"
                                      fill={filled ? "#FFD700" : "#E0E0E0"}
                                    />
                                  </svg>
                                </div>
                              </div>
                            )
                          })}
                          {service.reviewCount > 0 && (
                            <span className="text-[10px] text-gray-500 mr-1">({service.reviewCount})</span>
                          )}
                          <span className="text-[12px] font-bold text-[#2d2871] mr-2">
                            {service.price?.toFixed(2) || '0.00'} $
                          </span>
                        </div>
                      </div>
                      <div className="h-[80px] relative rounded-[13px] shrink-0 w-[80px] overflow-hidden">
                        <div className="absolute bg-[#d9d9d9] inset-0 rounded-[13px]"></div>
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={service.nameAr || service.name}
                            className="absolute max-w-none object-cover rounded-[13px] size-full"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              const fallback = e.target.nextElementSibling
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        {!imageSrc && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-[13px]">
                            <span className="text-xl">📷</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>

    </div>
      <BottomNavigation />
    </>
  )
}

export default Services
