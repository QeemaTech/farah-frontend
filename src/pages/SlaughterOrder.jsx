import React, { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiTruck, FiMapPin, FiEdit3, FiInfo } from 'react-icons/fi'
import axios from 'axios'
import { toast } from 'react-toastify'
import BackHeader from '../components/BackHeader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export default function SlaughterOrder() {
  const navigate = useNavigate()
  const location = useLocation()
  
  if (!location.state?.orderData) {
    return <Navigate to="/slaughter" replace />
  }

  const { item, guestCount, bookingId, region } = location.state.orderData
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    deliveryType: 'venue', // venue | home
    notes: ''
  })

  const handleSubmitOrder = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.info('الرجاء تسجيل الدخول أولاً لإتمام الطلب')
        // Save state to localStorage to restore after login if needed
        navigate('/login', { state: { returnUrl: '/slaughter/order', orderData: location.state.orderData } })
        return
      }

      await axios.post(`${API}/api/mobile/slaughter/orders`, {
        bookingId,
        guestCount,
        deliveryType: formData.deliveryType,
        notes: formData.notes,
        items: [{ productId: item.product.id, quantity: item.quantity }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('تم رفع طلب الذبائح بنجاح! 🎉')
      
      if (bookingId) {
        // Return to booking details if it was linked
        navigate(`/bookings/${bookingId}`)
      } else {
        // Or go to home/orders page
        navigate('/home')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ أثناء رفع الطلب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28" dir="rtl">
      <BackHeader title="تأكيد طلب الذبائح" />

      <div className="px-5 py-6 max-w-lg mx-auto space-y-6">
        
        {/* Order Summary */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiCheckCircle className="text-indigo-500" /> ملخص الطلب
          </h2>
          
          <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl mb-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-1 shrink-0 border border-gray-100">
              {item.product.image ? <img src={`${API}${item.product.image}`} className="w-full h-full object-contain" /> : '🐑'}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-sm">{item.product.nameAr}</h4>
              <p className="text-xs text-gray-500">الكمية: {item.quantity} ذبائح</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-indigo-600">{item.totalPrice.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">ر.س</p>
            </div>
          </div>

          {bookingId && (
            <div className="bg-indigo-50 text-indigo-700 text-xs p-3 rounded-xl flex items-start gap-2">
              <FiInfo className="mt-0.5 shrink-0" />
              <p leading-relaxed>سيتم ربط هذا الطلب بحجزك الحالي. الخدمة مجانية ولا تُضاف لإجمالي القاعة، وسيتم الدفع للمورد مباشرة.</p>
            </div>
          )}
        </div>

        {/* Delivery Options */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <FiTruck className="text-indigo-500" /> خيارات التوصيل
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setFormData({...formData, deliveryType: 'venue'})}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2
                ${formData.deliveryType === 'venue' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
            >
              <FiMapPin className="text-xl" />
              <span className="text-sm font-bold">توصيل للقاعة</span>
            </div>
            <div 
              onClick={() => setFormData({...formData, deliveryType: 'home'})}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2
                ${formData.deliveryType === 'home' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
            >
              <FiTruck className="text-xl" />
              <span className="text-sm font-bold">توصيل لموقع آخر</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <label className="font-bold text-gray-800 flex items-center gap-2">
            <FiEdit3 className="text-indigo-500" /> ملاحظات الطلب (اختياري)
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="مثال: التوصيل يوم الخميس الساعة ٤ عصراً، وتقطيع الذبيحة أنصاف..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-28"
          ></textarea>
        </div>

      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex items-center gap-4 z-10 max-w-lg mx-auto">
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium">الإجمالي التقديري</p>
          <p className="font-black text-xl text-gray-900">{item.totalPrice.toLocaleString()} <span className="text-xs text-gray-500">ر.س</span></p>
        </div>
        <button 
          onClick={handleSubmitOrder}
          disabled={loading}
          className={`flex-[2] bg-gray-900 text-white rounded-xl py-3.5 font-bold text-sm flex justify-center items-center gap-2 transition-all active:scale-95
            ${loading ? 'opacity-70' : 'hover:bg-black'}`}
        >
          {loading ? 'جاري التأكيد...' : 'تأكيد الطلب'}
        </button>
      </div>

    </div>
  )
}
