import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import { countryCodes, getDefaultCountry } from '../utils/countryCodes'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading: authLoading, login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    phone: '',
    email: '',
    location: '',
    locationAr: '',
  })
  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountry())
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [searchCountry, setSearchCountry] = useState('')
  const countryDropdownRef = useRef(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async () => {
    // Validation
    if (!agreed) {
      alert('يجب الموافقة على اتفاقية المستخدم وسياسة الخصوصية')
      return
    }
    if ((!formData.name || formData.name.trim() === '') && (!formData.nameAr || formData.nameAr.trim() === '')) {
      alert('يرجى إدخال الاسم (عربي أو إنجليزي)')
      return
    }
    if (!formData.phone || formData.phone.trim() === '') {
      alert('يرجى إدخال رقم الهاتف')
      return
    }
    
    // Ensure at least one name is provided
    let finalName = formData.name?.trim() || ''
    let finalNameAr = formData.nameAr?.trim() || ''
    
    if (!finalName && !finalNameAr) {
      alert('يرجى إدخال الاسم (عربي أو إنجليزي)')
      return
    }
    
    // If one name is missing, use the other
    if (!finalName && finalNameAr) {
      finalName = finalNameAr
    }
    if (!finalNameAr && finalName) {
      finalNameAr = finalName
    }
    
    const fullPhone = `${selectedCountry.code}${formData.phone.replace(/\s/g, '')}`
    
    try {
      setLoading(true)
      
      // Prepare registration data
      const registrationData = {
        name: finalName,
        nameAr: finalNameAr,
        phone: fullPhone,
      }
      
      // Only include optional fields if they have values
      if (formData.email?.trim()) {
        registrationData.email = formData.email.trim()
      }
      if (formData.location?.trim()) {
        registrationData.location = formData.location.trim()
      }
      if (formData.locationAr?.trim()) {
        registrationData.locationAr = formData.locationAr.trim()
      }
      
      console.log('Registering with data:', { ...registrationData, phone: fullPhone })
      
      // Register user directly without OTP
      const response = await axios.post(`${API_URL}/auth/register`, registrationData)
      
      if (response.data.success) {
        const { user, token } = response.data
        
        // Login user immediately
        login(user, token)
        
        // Check if location permission was already granted
        const locationPermission = localStorage.getItem('location_permission_granted')
        
        // If location permission not granted, redirect to location permission page
        if (!locationPermission || locationPermission === 'denied') {
          navigate('/location-permission', { replace: true })
        } else {
          // Always redirect to home after successful registration
          navigate('/home', { replace: true })
        }
      }
    } catch (error) {
      console.error('Error registering:', error)
      console.error('Error response:', error.response?.data)
      
      // Get error message from response
      let errorMessage = 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.'
      const errorData = error.response?.data
      
      if (errorData) {
        // Backend sends error in 'error' field
        const errorText = errorData.error || errorData.message || ''
        
        // Handle specific error cases
        if (errorText === 'PHONE_EXISTS' || errorText.includes('phone') || errorText.includes('Phone') || errorText.includes('already exists')) {
          errorMessage = 'رقم الهاتف مسجل من قبل. يرجى استخدام رقم هاتف آخر أو تسجيل الدخول.'
        } else if (errorText === 'EMAIL_EXISTS' || errorText.includes('email') || errorText.includes('Email')) {
          errorMessage = 'البريد الإلكتروني مسجل من قبل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.'
        } else if (errorText === 'EMAIL_AND_PHONE_EXIST') {
          errorMessage = 'البريد الإلكتروني ورقم الهاتف مسجلين من قبل. يرجى استخدام بيانات أخرى أو تسجيل الدخول.'
        } else if (errorText.includes('Name') || errorText.includes('name') || errorText.includes('الاسم')) {
          errorMessage = 'يرجى إدخال الاسم (عربي أو إنجليزي)'
        } else if (errorText.includes('Phone') || errorText.includes('phone') || errorText.includes('هاتف')) {
          errorMessage = 'يرجى إدخال رقم الهاتف بشكل صحيح'
        } else if (errorText) {
          errorMessage = errorText
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
      // Stay on register page - don't redirect
    } finally {
      setLoading(false)
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


    <>
        <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">

{/* Decorative Background Pattern */}
<div className="absolute inset-0 pointer-events-none overflow-hidden">
  <div className="absolute top-0 left-0 w-full h-1/3 opacity-5">
    <div className="absolute inset-0 bg-gradient-to-br from-[#EF92AB] via-[#f8d3dd] to-transparent"></div>
  </div>
</div>

{/* Header */}
<div className="absolute content-stretch flex items-center justify-between left-1/2 top-[20px] translate-x-[-50%] w-[350px] z-10">
  <div className="content-stretch flex items-center justify-center opacity-0 relative shrink-0 size-[32px]"></div>
  <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
    إنشاء حساب جديد
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
<div className="absolute content-stretch flex flex-col gap-[16px] items-start left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-10 pb-[150px]">
  {/* Name Input */}
  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
    <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
      الاسم (عربي) *
    </label>
    <div className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full hover:border-[#2d2871] transition-colors">
      <input
        type="text"
        name="nameAr"
        value={formData.nameAr}
        onChange={handleChange}
        placeholder="أدخل اسمك بالعربية"
        className="font-['Cairo:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[16px] w-full outline-none text-right placeholder:text-[#999]"
        dir="rtl"
      />
    </div>
  </div>

  {/* Name (English) Input */}
  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
    <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
      الاسم (إنجليزي) *
    </label>
    <div className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full hover:border-[#2d2871] transition-colors">
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter your name in English"
        className="font-['Cairo:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[16px] w-full outline-none text-left placeholder:text-[#999]"
        dir="ltr"
      />
    </div>
  </div>

  {/* Phone Input Section */}
  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
    <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
      رقم الهاتف *
    </label>
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
            <div className="fixed md:absolute top-auto md:top-[56px] left-0 md:left-0 right-0 md:right-auto bottom-0 md:bottom-auto w-full md:w-[320px] max-w-[390px] md:max-w-none bg-white border-t md:border border-[#e6e6e6] rounded-t-[20px] md:rounded-[12px] shadow-lg z-[100] max-h-[70vh] md:max-h-[400px] overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-[#e6e6e6] sticky top-0 bg-white z-10">
              <input
                type="text"
                placeholder="ابحث عن دولة..."
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
                className="w-full px-4 py-3 border border-[#e6e6e6] rounded-[12px] text-sm outline-none focus:border-[#2d2871]"
                dir="rtl"
                autoFocus
              />
            </div>
            
            {/* Countries List */}
            <div className="overflow-y-auto max-h-[calc(70vh-80px)] md:max-h-[320px]">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <div
                    key={country.code + country.name}
                    onClick={() => {
                      setSelectedCountry(country)
                      setShowCountryDropdown(false)
                      setSearchCountry('')
                    }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors ${
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
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="50123456"
          className="font-['Cairo:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[16px] w-full outline-none text-right placeholder:text-[#999]"
          dir="rtl"
        />
      </div>
    </div>
  </div>

  {/* Email Input (Optional) */}
  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
    <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
      البريد الإلكتروني (اختياري)
    </label>
    <div className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full hover:border-[#2d2871] transition-colors">
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="example@email.com"
        className="font-['Cairo:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[16px] w-full outline-none text-left placeholder:text-[#999]"
        dir="ltr"
      />
    </div>
  </div>

  {/* Location Input (Optional) */}
  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
    <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
      الموقع (اختياري)
    </label>
    <div className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full hover:border-[#2d2871] transition-colors">
      <input
        type="text"
        name="locationAr"
        value={formData.locationAr}
        onChange={handleChange}
        placeholder="أدخل موقعك"
        className="font-['Cairo:Regular',sans-serif] font-normal leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[16px] w-full outline-none text-right placeholder:text-[#999]"
        dir="rtl"
      />
    </div>
  </div>

  {/* Agreement Checkbox */}
  <div className="content-stretch flex gap-[5px] items-center justify-end relative shrink-0 w-full mt-4">
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




</div>
    
      {/* Bottom Action Button */}
      <div className="absolute content-stretch flex flex-col items-center left-0 bottom-0 w-[390px] z-10">
        <button
          onClick={handleRegister}
          disabled={loading}
          className="bg-[#2d2871] content-stretch cursor-pointer flex h-[50px] items-center justify-center p-[10px] relative rounded-[63px] shrink-0 w-[350px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1f1a5a] transition-colors"
        >
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-left text-white" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            {loading ? 'جاري التسجيل...' : 'متابعة'}
          </p>
        </button>
        <div className="h-[35px] relative shrink-0 w-full">
          <div className="absolute bg-[rgba(27,27,27,0.85)] inset-[55.88%_32%_29.41%_32.27%] rounded-[2.5px]"></div>
        </div>
      </div>
    </>
  )
}

export default Register

