import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function AddCard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    cvv: '',
    expiryDate: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Frontend validation
    if (!formData.cardNumber || !formData.cardholderName || !formData.cvv || !formData.expiryDate) {
      alert('الرجاء إدخال جميع البيانات المطلوبة')
      return
    }

    // Validate card number (must be 16 digits after removing spaces)
    const cleanCardNumber = formData.cardNumber.replace(/\s/g, '')
    if (cleanCardNumber.length !== 16 || !/^\d{16}$/.test(cleanCardNumber)) {
      alert('رقم البطاقة يجب أن يكون 16 رقم')
      return
    }

    // Validate expiry date format (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      alert('تاريخ الانتهاء يجب أن يكون بصيغة MM/YY (مثال: 12/25)')
      return
    }

    // Validate CVV (3-4 digits)
    if (!/^\d{3,4}$/.test(formData.cvv)) {
      alert('CVV يجب أن يكون 3 أو 4 أرقام')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('يرجى تسجيل الدخول أولاً')
        navigate('/login')
        return
      }
      
      // Save card to backend
      const response = await axios.post(
        `${API_URL}/mobile/cards`,
        {
          cardNumber: cleanCardNumber,
          cardholderName: formData.cardholderName.trim(),
          cvv: formData.cvv,
          expiryDate: formData.expiryDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        // If coming from booking confirmation, go back and refresh cards
        if (location.state?.from === 'booking-confirmation') {
          navigate('/booking-confirmation', { 
            state: { 
              ...location.state?.bookingData,
              refreshCards: true // Flag to refresh cards
            } 
          })
        } else {
          navigate(-1)
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'فشل إضافة البطاقة'
      alert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (

  


    <>
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative overflow-hidden">
  
      {/* Decorative Background */}
      <div className="absolute left-[-249px] top-[90px] pointer-events-none">
        <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
          <div className="h-[342.961px] w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full" />
        </div>
      </div>
  
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between w-[350px] mx-auto pt-[90px]">
        <div className="opacity-0 size-[32px]" />
        <p
          className="text-[#121212] text-[18px] font-bold"
          style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}
        >
          إضافة بطاقة
        </p>
        <button onClick={() => navigate(-1)} className="rotate-180">
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
  
      {/* Main Content */}
      <div className="relative flex flex-col gap-5 px-5 mt-6 pb-[160px]">
  
        {/* Credit Card */}
        <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-4 left-4 w-12 h-10 bg-white/30 rounded-md" />
  
          <div className="absolute top-4 right-4">
            <svg width="24" height="24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2" fill="white" />
            </svg>
          </div>
  
          <p className="mt-16 mb-6 text-2xl font-bold tracking-wider">
            {formData.cardNumber || '0000 0000 0000 0000'}
          </p>
  
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80">VALID THRU</p>
              <p>{formData.expiryDate || '00/00'}</p>
            </div>
            <p className="uppercase text-sm">
              {formData.cardholderName || 'TACCHINO DAVIDE'}
            </p>
          </div>
  
          <div className="absolute bottom-4 right-4 font-bold">VISA</div>
        </div>
  
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
  
          {/* Card Number */}
          <input
            type="text"
            value={formData.cardNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                cardNumber: formatCardNumber(e.target.value),
              })
            }
            placeholder="رقم البطاقة الائتمانية"
            maxLength={19}
            className="border rounded-xl px-4 py-3 text-right"
            dir="rtl"
            required
          />
  
          {/* Name */}
          <input
            type="text"
            value={formData.cardholderName}
            onChange={(e) =>
              setFormData({ ...formData, cardholderName: e.target.value.toUpperCase() })
            }
            placeholder="اسم حامل الهوية"
            className="border rounded-xl px-4 py-3 text-right"
            dir="rtl"
            required
          />
  
          {/* CVV & Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={formData.cvv}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cvv: e.target.value.replace(/\D/g, '').slice(0, 3),
                })
              }
              placeholder="CVV"
              maxLength={3}
              className="border rounded-xl px-4 py-3 text-right"
              required
            />
            <input
              type="text"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expiryDate: formatExpiryDate(e.target.value),
                })
              }
              placeholder="MM/YY"
              maxLength={5}
              className="border rounded-xl px-4 py-3 text-right"
              required
            />
          </div>
        </form>
      </div>
  
      {/* Bottom Action */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white rounded-t-2xl shadow-2xl px-5 pt-3 pb-8">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#2d2871] text-white rounded-full py-3 font-bold disabled:opacity-50"
        >
          {submitting ? 'جاري الحفظ...' : 'تأكيد البيانات'}
        </button>
        <div className="flex justify-center mt-4">
          <div className="w-32 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>
  
    </div>
  </>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
  )
}

export default AddCard
