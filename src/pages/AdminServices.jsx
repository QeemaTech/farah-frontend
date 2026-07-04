import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function AdminServices() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchServices()
  }, [search])

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/services`, {
        params: { search, limit: 50 }
      })
      setServices(response.data.services || [])
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id, isActive) => {
    try {
      await axios.patch(`${API_URL}/admin/services/${id}/status`, { isActive })
      fetchServices()
    } catch (error) {
      alert('فشل تحديث الحالة')
    }
  }

  const deleteService = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return
    try {
      await axios.delete(`${API_URL}/admin/services/${id}`)
      fetchServices()
    } catch (error) {
      alert('فشل حذف الخدمة')
    }
  }

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      <StatusBar />

      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-[20px] top-[66px] w-[350px] z-20">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center justify-center relative shrink-0 size-[32px] bg-white rounded-full shadow-sm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
            <path
              d="M15 18L9 12L15 6"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center flex-1" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          إدارة الخدمات
        </p>
        <div className="w-[32px]"></div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-[350px] left-[20px] top-[132px] overflow-y-auto pb-[100px]">
        
        {/* Search Bar */}
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الخدمات..."
            className="bg-white border border-[#e6e6e6] border-solid content-stretch flex flex-[1_0_0] h-[44px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 outline-none text-right"
            dir="rtl"
          />
        </div>

        {/* Services List */}
        {loading ? (
          <div className="text-center py-10 w-full">جاري التحميل...</div>
        ) : (
          <div className="content-stretch flex flex-col gap-[12px] items-stretch relative shrink-0 w-full">
            {services.map((service) => {
              const images = Array.isArray(service.images) ? service.images : (service.images ? [service.images] : [])
              return (
                <div
                  key={service.id}
                  className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full"
                >
                  <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0 flex-1">
                      <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                        {service.nameAr || service.name}
                      </p>
                      <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                        {service.category?.nameAr || service.category?.name || '-'} | {service.provider?.name || '-'}
                      </p>
                      <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0">
                        <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          {service.price?.toFixed(2) || '0.00'} $ | ⭐ {service.rating?.toFixed(1) || '0.0'} ({service.reviewCount || 0})
                        </p>
                      </div>
                    </div>
                    {(() => {
                      const imageSrc = images.length > 0 ? formatImageSrc(images[0]) : null
                      return imageSrc ? (
                        <div className="h-[60px] w-[60px] relative rounded-[12px] overflow-hidden shrink-0">
                          <img 
                            src={imageSrc} 
                            alt={service.nameAr || service.name} 
                            className="absolute inset-0 object-cover size-full"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              const fallback = e.target.nextElementSibling
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 hidden">
                            <span className="text-xl">📷</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[60px] w-[60px] relative rounded-[12px] overflow-hidden shrink-0 bg-gray-200 flex items-center justify-center">
                          <span className="text-xl">📷</span>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-full">
                    <span className={`px-[12px] py-[4px] rounded-[12px] ${
                      service.isActive ? 'bg-[#d4edda] text-[#155724]' : 'bg-[#f8d7da] text-[#721c24]'
                    }`}>
                      <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[12px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                        {service.isActive ? 'نشط' : 'غير نشط'}
                      </p>
                    </span>
                    <button
                      onClick={() => toggleStatus(service.id, !service.isActive)}
                      className={`px-[12px] py-[6px] rounded-[8px] ${
                        service.isActive ? 'bg-[#dc3545]' : 'bg-[#28a745]'
                      } text-white text-[12px]`}
                    >
                      {service.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => deleteService(service.id)}
                      className="px-[12px] py-[6px] rounded-[8px] bg-[#dc3545] text-white text-[12px]"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              )
            })}
            {services.length === 0 && (
              <div className="text-center py-10 text-[#666]">لا توجد نتائج</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminServices




