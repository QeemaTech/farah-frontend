import { useState, useEffect } from 'react'
import axios from 'axios'
import Drawer from './Drawer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function SelectServicesDrawer({ isOpen, onClose, onNext, selectedServices = [], onServicesChange }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(selectedServices || [])

  useEffect(() => {
    if (isOpen) {
      fetchServices()
    }
  }, [isOpen])

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/mobile/services`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      setServices(response.data.services || [])
    } catch (error) {
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (serviceId) => {
    const newSelected = selected.includes(serviceId)
      ? selected.filter(id => id !== serviceId)
      : [...selected, serviceId]
    setSelected(newSelected)
    if (onServicesChange) {
      onServicesChange(newSelected)
    }
  }

  const handleNext = () => {
    if (onNext) {
      onNext(selected)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="حدد الخدمات">
      <div className="flex flex-col gap-3 pb-20">
        {loading ? (
          <div className="text-center py-10">جاري التحميل...</div>
        ) : services.length === 0 ? (
          <div className="text-center py-10 text-gray-500">لا توجد خدمات متاحة</div>
        ) : (
          services.map((service) => {
            const isSelected = selected.includes(service.id)
            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[#edecf8] border-[#2d2871]'
                    : 'border-[#f2f2f2] bg-white'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-gray-800 text-right flex-1">
                    {service.nameAr || service.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    +50 $
                  </span>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-[#2d2871] bg-[#2d2871]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
            )
          })
        )}
      </div>
      
      {/* Bottom Button */}
      <div className="sticky bottom-0 bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5 border-t border-gray-100 mt-4">
        <button
          onClick={handleNext}
          className="w-full bg-[#2d2871] text-white rounded-[38px] py-3.5 text-base font-bold hover:bg-[#1f1a5a] transition-colors"
        >
          التالي
        </button>
      </div>
    </Drawer>
  )
}

export default SelectServicesDrawer

