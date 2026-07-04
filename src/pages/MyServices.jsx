import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function MyServices() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/mobile/services`)
      setServices(response.data.services || [])
    } catch (error) {
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      <StatusBar />

      {/* Header */}
      <div className="fixed top-[66px] left-1/2 transform -translate-x-1/2 w-full max-w-[390px] flex items-center justify-between px-5 bg-white z-10">
        <div className="w-8 h-8 opacity-0"></div>
        <h1 className="text-lg font-bold text-gray-800">خدماتي</h1>
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
      <div className="pt-[118px] pb-[93px] px-5 flex flex-col gap-4">
        {/* Add Service Button */}
        <button
          onClick={() => navigate('/services/add')}
          className="bg-[#edecf8] text-[#2d2871] rounded-xl px-4 py-3 flex items-center justify-center gap-2 self-start"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M10 4V16M4 10H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm font-bold">إضافة خدمة</span>
        </button>

        {/* Services List */}
        {loading ? (
          <div className="text-center py-10">جاري التحميل...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {services.length === 0 ? (
              <div className="text-center py-10 text-gray-500">لا توجد خدمات متاحة</div>
            ) : (
              services.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-[#f2f2f2] rounded-2xl p-4 flex gap-4"
              >
                {/* Edit Button */}
                <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M11.3333 2.00001C11.5084 1.8249 11.7163 1.68601 11.9447 1.5913C12.1731 1.49659 12.4173 1.44775 12.6667 1.44775C12.916 1.44775 13.1602 1.49659 13.3886 1.5913C13.617 1.68601 13.8249 1.8249 14 2.00001C14.1751 2.17512 14.314 2.38305 14.4087 2.61144C14.5034 2.83983 14.5522 3.08399 14.5522 3.33334C14.5522 3.58269 14.5034 3.82685 14.4087 4.05524C14.314 4.28363 14.1751 4.49156 14 4.66667L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00001Z"
                      stroke="#121212"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Service Info */}
                <div className="flex-1 flex flex-col gap-2 items-end">
                  <h3 className="text-base font-bold text-gray-800 text-right">
                    {service.nameAr || service.name}
                  </h3>
                  <p className="text-sm text-gray-600 text-right">
                    {service.descriptionAr || service.description || ''}
                  </p>
                  <div className="flex items-center gap-2">
                    {service.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-yellow-500">⭐</span>
                        <span className="text-xs text-gray-600">{service.rating.toFixed(1)}</span>
                        {service.reviewCount > 0 && (
                          <span className="text-xs text-gray-400">({service.reviewCount})</span>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {service.location || service.address || ''}
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M6 6C6.82843 6 7.5 5.32843 7.5 4.5C7.5 3.67157 6.82843 3 6 3C5.17157 3 4.5 3.67157 4.5 4.5C4.5 5.32843 5.17157 6 6 6Z"
                        stroke="#4d4d4d"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M2.5 4.5C2.5 7.5 6 10.5 6 10.5C6 10.5 9.5 7.5 9.5 4.5C9.5 2.51472 7.98528 1 6 1C4.01472 1 2.5 2.51472 2.5 4.5Z"
                        stroke="#4d4d4d"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>

                {/* Service Image */}
                {(() => {
                  // Handle images array or single image
                  const images = Array.isArray(service.images) ? service.images : (service.images ? [service.images] : [])
                  const imageSrc = images.length > 0 ? formatImageSrc(images[0]) : null
                  
                  return imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={service.nameAr || service.name}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const fallback = e.target.nextElementSibling
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null
                })()}
                <div className="w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 hidden">
                  <span className="text-2xl">📷</span>
                </div>
              </div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default MyServices

