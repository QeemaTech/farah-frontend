import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function AdditionalServices() {
  const navigate = useNavigate()
  const location = useLocation()
  const booking = location.state?.booking || {}
  const [selectedServices, setSelectedServices] = useState([])
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
      console.error('Error fetching services:', error)
      // Use default services if API fails
      setServices([
        { id: '1', name: 'البوفيه', nameAr: 'البوفيه', price: 50 },
        { id: '2', name: 'مصورين', nameAr: 'مصورين', price: 50 },
        { id: '3', name: 'خبيرة تجميل', nameAr: 'خبيرة تجميل', price: 50 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    )
  }

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
        <h1 className="text-lg font-bold text-gray-800">إضافات</h1>
        <div className="w-8 h-8 opacity-0"></div>
      </div>

      {/* Main Content */}
      <div className="pt-[118px] pb-[100px] px-5 flex flex-col gap-4">
        <p className="text-sm text-gray-600 text-right">
          هل تريد إضافة خدمات أخري مع القاعة؟
        </p>

        {/* Services List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-10">جاري التحميل...</div>
          ) : (
            services.map((service) => (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${
                  selectedServices.includes(service.id)
                    ? 'bg-[#edecf8] border-[#2d2871]'
                    : 'border-[#f2f2f2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{service.icon || '📋'}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {service.nameAr || service.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    +{service.price || 0} ر.س
                  </span>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedServices.includes(service.id)
                        ? 'border-[#2d2871] bg-[#2d2871]'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedServices.includes(service.id) && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[393px] bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-100 text-gray-600 rounded-[38px] py-3.5 text-base font-bold"
          >
            تخطي
          </button>
          <button
            onClick={() => {
              const serviceIds = selectedServices
              navigate('/booking-confirmation', {
                state: {
                  ...booking,
                  serviceIds,
                  additionalServices: services
                    .filter(s => selectedServices.includes(s.id))
                    .map(s => ({ id: s.id, name: s.nameAr || s.name, price: s.price || 0 })),
                  servicesPrice: services
                    .filter(s => selectedServices.includes(s.id))
                    .reduce((sum, s) => sum + (s.price || 0), 0)
                }
              })
            }}
            className="flex-1 bg-[#2d2871] text-white rounded-[38px] py-3.5 text-base font-bold"
          >
            إستمرار
          </button>
        </div>
        <div className="h-[35px] flex items-center justify-center">
          <div className="w-[134px] h-1 bg-[#4e5868] rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

export default AdditionalServices




