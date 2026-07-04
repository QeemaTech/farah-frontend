import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import { countryCodes, getDefaultCountry } from '../utils/countryCodes'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [phone, setPhone] = useState('010 1280 4721')
  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountry())
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [searchCountry, setSearchCountry] = useState('')
  const countryDropdownRef = useRef(null)
  const dropdownContainerRef = useRef(null)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    // Redirect if already authenticated
    if (!authLoading && isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate, location.state?.from?.pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = countryCodes.filter(country =>
    country.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
    country.nameEn.toLowerCase().includes(searchCountry.toLowerCase()) ||
    country.code.includes(searchCountry)
  )

  const handleLogin = async () => {
    if (!agreed) {
      alert('يجب الموافقة على اتفاقية المستخدم وسياسة الخصوصية')
      return
    }
    if (!phone || phone.trim() === '') {
      alert('يرجى إدخال رقم الهاتف')
      return
    }
    
    const fullPhone = `${selectedCountry.code}${phone.replace(/\s/g, '')}`
    
    try {
      // Send OTP to backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'
      await axios.post(`${API_URL}/auth/otp/send`, { phone: fullPhone })
      
      navigate('/otp', { state: { phone: fullPhone, from: location.state?.from } })
    } catch (error) {
      console.error('Error sending OTP:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'فشل إرسال رمز المصادقة'
      
      // Check if user doesn't exist
      if (errorMessage.includes('not found') || errorMessage.includes('لا يوجد') || error.response?.status === 404) {
        const confirmMessage = 'رقم الهاتف غير مسجل. هل تريد إنشاء حساب جديد؟'
        if (confirm(confirmMessage)) {
          navigate('/register', { 
            state: { 
              phone: fullPhone,
              from: location.state?.from 
            } 
          })
        }
      } else if (!error.response) {
        // Network error — backend unreachable, navigate anyway so user can test OTP
        console.warn('Backend unreachable, navigating to OTP page anyway (dev mode)')
        navigate('/otp', { state: { phone: fullPhone, from: location.state?.from } })
      } else {
        // Server returned an error (e.g. 429 rate limit, 500 server error)
        alert(errorMessage)
      }
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">جاري التحميل...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
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
        <div className="content-stretch flex items-center justify-center opacity-0 relative shrink-0 size-[32px]"></div>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          تسجيل الدخول
        </p>
        <button
          onClick={() => navigate(-1)}
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
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-10">
        {/* Phone Input Section */}
        <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full">
          {/* Country Code Selector */}
          <div className="relative" ref={countryDropdownRef}>
            <div 
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center justify-between p-[12px] relative rounded-[12px] shrink-0 w-[80px] cursor-pointer hover:border-[#2d2871] transition-colors"
            >
              <div className="content-stretch flex gap-[6px] h-full items-center justify-center relative shrink-0">
                <span className="text-2xl leading-none">{selectedCountry.flag}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}>
                <path d="M6 9L12 15L18 9" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            {/* Country Dropdown */}
            {showCountryDropdown && (
              <>
                {/* Backdrop for mobile */}
                <div 
                  className="fixed inset-0 bg-black/20 z-[99] md:hidden"
                  onClick={() => setShowCountryDropdown(false)}
                />
                {/* Dropdown - Opens from bottom on mobile, downward on desktop */}
                <div 
                  ref={dropdownContainerRef}
                  className="fixed md:absolute left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 bottom-0 md:bottom-auto md:top-[56px] w-full md:w-[320px] max-w-[390px] md:max-w-none bg-white border-t md:border border-[#e6e6e6] rounded-t-[20px] md:rounded-[12px] shadow-lg z-[100] max-h-[70vh] md:max-h-[400px] flex flex-col overflow-hidden"
                  style={{
                    animation: 'slideUp 0.3s ease-out'
                  }}
                >
                  {/* Search Input */}
                  <div className="p-3 border-b border-[#e6e6e6] bg-white flex-shrink-0 sticky top-0 z-10">
                    <input
                      type="text"
                      placeholder="ابحث عن دولة..."
                      value={searchCountry}
                      onChange={(e) => setSearchCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e6e6e6] rounded-[12px] text-sm outline-none focus:border-[#2d2871] transition-colors"
                      dir="rtl"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Countries List - Scrollable */}
                  <div className="overflow-y-auto flex-1 overscroll-contain">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <div
                          key={country.code + country.name}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCountry(country)
                            setShowCountryDropdown(false)
                            setSearchCountry('')
                          }}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedCountry.code === country.code && selectedCountry.name === country.name ? 'bg-[#2d2871]/10' : ''
                          }`}
                        >
                          <span className="text-2xl flex-shrink-0">{country.flag}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-['Cairo:Medium',sans-serif] text-sm text-[#121212] truncate">{country.name}</p>
                            <p className="font-['Cairo:Regular',sans-serif] text-xs text-gray-500 truncate">{country.nameEn}</p>
                          </div>
                          <p className="font-['Cairo:Medium',sans-serif] text-sm text-[#2d2871] flex-shrink-0">{country.code}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <p className="font-['Cairo:Regular',sans-serif] text-sm">لا توجد نتائج</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Phone Number Input */}
          <div className="bg-white border border-[#e6e6e6] border-solid content-stretch flex flex-[1_0_0] h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 hover:border-[#2d2871] transition-colors">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0000000000"
              className="font-['Cairo:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[16px] w-full outline-none text-right placeholder:text-[#999]"
              dir="rtl"
            />
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="content-stretch flex gap-[5px] items-center justify-end relative shrink-0 w-full">
          <p className="flex-[1_0_0] font-['MadaniArabic-Regular:Regular',sans-serif] h-[33px] leading-[1.5] min-h-px min-w-px not-italic relative shrink-0 text-[#666] text-[12px] text-justify whitespace-pre-wrap">
            <span className="font-['Cairo:Medium',sans-serif] font-medium">هل توافق على</span>
            <span className="font-['Cairo:Regular',sans-serif] font-normal"> </span>
            <span className="font-['Cairo:Bold',sans-serif] font-bold text-[#2d2871]">اتفاقية المستخدم</span>
            <span className="font-['Cairo:Regular',sans-serif] font-normal"> </span>
            <span className="font-['Cairo:Medium',sans-serif] font-medium">و</span>
            <span className="font-['Cairo:Bold',sans-serif] font-bold text-[#2d2871]"> </span>
            <span className="font-['Cairo:Bold',sans-serif] font-bold text-[#2d2871]">سياسة الخصوصية</span>
            <span className="font-['Cairo:Regular',sans-serif] font-normal"> </span>
            <span className="font-['Cairo:Medium',sans-serif] font-medium">الخاصة بنا.</span>
          </p>
          <div className="relative shrink-0 size-[24px]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-6 h-6 rounded border-gray-300 text-[#2d2871] focus:ring-[#2d2871] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="absolute content-stretch flex flex-col items-center left-0 bottom-0 w-[390px] z-10">
        <button
          onClick={handleLogin}
          className="bg-[#2d2871] content-stretch cursor-pointer flex h-[50px] items-center justify-center p-[10px] relative rounded-[63px] shrink-0 w-[350px]"
        >
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-left text-white" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            تسجيل الدخول
          </p>
        </button>
        
        {/* Register Link */}
        <div className="content-stretch flex gap-[7px] items-center justify-center leading-[1.5] relative shrink-0 text-[14px] mt-4">
          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-[#121212] text-center">
            ليس لديك حساب؟
          </p>
          <button
            onClick={() => navigate('/register')}
            className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] relative shrink-0 text-[#2d2871] cursor-pointer hover:underline"
            style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}
          >
            إنشاء حساب جديد
          </button>
        </div>
        
        <div className="h-[35px] relative shrink-0 w-full">
          <div className="absolute bg-[rgba(27,27,27,0.85)] inset-[55.88%_32%_29.41%_32.27%] rounded-[2.5px]"></div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        @media (min-width: 768px) {
          @keyframes slideUp {
            from {
              transform: translateY(-10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        }
      `}</style>
    </div>
  )
}

export default Login
