import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import axios from 'axios'
import BottomNavigation from '../components/BottomNavigation'
import { formatImageSrc } from '../utils/imageUtils'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Coupons() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [copyingCode, setCopyingCode] = useState(null)

  const couponsFetchedRef = useRef(false)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Only fetch if user exists and we haven't fetched yet
    if (!user || couponsFetchedRef.current || fetchingRef.current) {
      return
    }

    fetchCoupons()
  }, [user?.id]) // Only depend on user.id, not the whole user object

  const fetchCoupons = async () => {
    if (fetchingRef.current) return
    
    fetchingRef.current = true
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        fetchingRef.current = false
        return
      }

      const response = await axios.get(`${API_URL}/mobile/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      })

      setCoupons(response.data.coupons || [])
      couponsFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error(language === 'ar' ? 'فشل تحميل القسائم' : 'Failed to load coupons')
      couponsFetchedRef.current = true
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopyingCode(code)
      toast.success(language === 'ar' ? 'تم نسخ الكود' : 'Code copied')
      setTimeout(() => setCopyingCode(null), 2000)
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل نسخ الكود' : 'Failed to copy code')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isExpiringSoon = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return daysLeft <= 7 && daysLeft > 0
  }

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/3 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-[#EF92AB] via-[#f8d3dd] to-transparent"></div>
        </div>
      </div>

      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-1/2 top-[10px] translate-x-[-50%] w-[350px] z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center relative shrink-0 size-[32px] bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
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
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          {language === 'ar' ? 'القسائم' : 'Coupons'}
        </p>
        <div className="content-stretch flex items-center justify-center opacity-0 relative shrink-0 size-[32px]"></div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-[1] pb-[200px]">
        {loading ? (
          <div className="w-full flex items-center justify-center py-20">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-[#2d2871] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.4823 3.13548 17.7846 4.24893 19.3216 6.06591C20.8586 7.88288 21.5024 10.2503 21 12.5V11.5Z"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#666] text-[16px] text-center">
              {language === 'ar' ? 'لا توجد قسائم متاحة حالياً' : 'No coupons available'}
            </p>
          </div>
        ) : (
          coupons.map((coupon) => {
            const imageSrc = formatImageSrc(coupon.image)
            const isExpiring = isExpiringSoon(coupon.endDate)
            const discountText = coupon.discountType === 'PERCENTAGE' 
              ? `${coupon.discountValue}%`
              : `${coupon.discountValue} ${language === 'ar' ? 'ر.س' : 'SAR'}`

            return (
              <div
                key={coupon.id}
                className={`bg-gradient-to-br from-[#2d2871] to-[#1f1a5a] content-stretch flex flex-col gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full ${
                  coupon.isUsed ? 'opacity-60' : ''
                } ${isExpiring ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {/* Coupon Header */}
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
                    <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-white text-[18px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                      {language === 'ar' ? coupon.titleAr : coupon.title}
                    </p>
                    {coupon.description && (
                      <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-white/80 text-[12px]">
                        {language === 'ar' ? coupon.descriptionAr : coupon.description}
                      </p>
                    )}
                  </div>
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt={coupon.title}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                </div>

                {/* Discount Badge */}
                <div className="bg-white/20 backdrop-blur-sm content-stretch flex items-center justify-center px-[12px] py-[8px] relative rounded-[8px] shrink-0">
                  <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-white text-[20px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                    {language === 'ar' ? `خصم ${discountText}` : `${discountText} OFF`}
                  </p>
                </div>

                {/* Coupon Code */}
                <div className="bg-white content-stretch flex items-center justify-between p-[12px] relative rounded-[12px] shrink-0 w-full">
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="flex items-center justify-center gap-[8px] px-[12px] py-[6px] bg-[#2d2871] text-white rounded-[8px] hover:bg-[#1f1a5a] transition-colors"
                  >
                    {copyingCode === coupon.code ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[12px]">
                          {language === 'ar' ? 'تم النسخ' : 'Copied'}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[12px]">
                          {language === 'ar' ? 'نسخ' : 'Copy'}
                        </span>
                      </>
                    )}
                  </button>
                  <div className="flex-1 text-center">
                    <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-[#2d2871] text-[16px] tracking-wider" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                      {coupon.code}
                    </p>
                  </div>
                </div>

                {/* Coupon Details */}
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  {coupon.minAmount && (
                    <div className="content-stretch flex items-center gap-[8px] relative shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                          fill="white"
                          fillOpacity="0.8"
                        />
                      </svg>
                      <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-white/80 text-[12px]">
                        {language === 'ar' 
                          ? `الحد الأدنى للشراء: ${coupon.minAmount} ر.س`
                          : `Minimum purchase: ${coupon.minAmount} SAR`
                        }
                      </p>
                    </div>
                  )}
                  <div className="content-stretch flex items-center gap-[8px] relative shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19Z"
                        fill="white"
                        fillOpacity="0.8"
                      />
                    </svg>
                    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-white/80 text-[12px]">
                      {language === 'ar' 
                        ? `صالح حتى: ${formatDate(coupon.endDate)}`
                        : `Valid until: ${formatDate(coupon.endDate)}`
                      }
                    </p>
                  </div>
                  {isExpiring && (
                    <div className="bg-yellow-400/20 content-stretch flex items-center gap-[8px] px-[8px] py-[4px] relative rounded-[6px] shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                          fill="#fbbf24"
                        />
                      </svg>
                      <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-yellow-400 text-[12px]">
                        {language === 'ar' ? 'ينتهي قريباً!' : 'Expiring soon!'}
                      </p>
                    </div>
                  )}
                  {coupon.isUsed && (
                    <div className="bg-red-500/20 content-stretch flex items-center gap-[8px] px-[8px] py-[4px] relative rounded-[6px] shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                          fill="#ef4444"
                        />
                      </svg>
                      <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-red-400 text-[12px]">
                        {language === 'ar' ? 'تم الاستخدام' : 'Already used'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Coupons

