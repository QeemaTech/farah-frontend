import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'

function OTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const phone = location.state?.phone

  // Guard: if no phone in state, redirect back to login
  useEffect(() => {
    if (!phone) {
      navigate('/login', { replace: true })
    }
  }, [phone, navigate])
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(45)
  const inputRefs = useRef([])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
  }, [])

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return
    
    // Handle paste (multiple digits)
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('').filter(d => /^\d$/.test(d))
      const newOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex((d, i) => i >= index && !d)
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(index + digits.length, 5)
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus()
      }, 0)
      
      // Auto-submit if all 6 digits are filled
      if (newOtp.every(d => d)) {
        setTimeout(() => handleSubmit(), 300)
      }
      return
    }
    
    // Single digit input
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input when a digit is entered
    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus()
      }, 0)
    }
    
    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const fullOtp = newOtp.join('')
      if (fullOtp.length === 6) {
        setTimeout(() => handleSubmit(), 300)
      }
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current field is empty, go to previous and clear it
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus()
        }, 0)
      } else if (otp[index]) {
        // If current field has value, clear it
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleSubmit = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      alert('يرجى إدخال رمز المصادقة الكامل')
      return
    }

    // Prevent multiple submissions
    if (inputRefs.current[0]?.disabled) {
      return
    }

    try {
      // Disable inputs during submission
      inputRefs.current.forEach(ref => {
        if (ref) ref.disabled = true
      })

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'
      
      // Verify OTP (only for login)
      const response = await axios.post(`${API_URL}/auth/otp/verify`, {
        phone: phone,
        otp: otpCode,
      })

      if (response.data && response.data.success) {
        const { user, token } = response.data
        
        if (!user) {
          throw new Error('Invalid response: user data missing')
        }
        
        // Check if user has name, if not redirect to profile to complete registration
        if (!user.name && !user.nameAr) {
          // User exists but missing name - redirect to profile to complete
          login(user, token)
          navigate('/user-profile', { 
            replace: true,
            state: { 
              message: 'يرجى إكمال بياناتك الشخصية',
              from: location.state?.from 
            } 
          })
          return
        }
        
        // Login user immediately
        login(user, token)
        
        // Check if location permission was already granted
        const locationPermission = localStorage.getItem('location_permission_granted')
        
        // If location permission not granted, redirect to location permission page
        if (!locationPermission || locationPermission === 'denied') {
          navigate('/location-permission', { replace: true })
        } else {
          // Always redirect to home after successful login (not to splash or root)
          navigate('/home', { replace: true })
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      
      // Re-enable inputs on error
      inputRefs.current.forEach(ref => {
        if (ref) ref.disabled = false
      })
      
      // Get error message
      let errorMessage = 'فشل التحقق من رمز المصادقة. يرجى المحاولة مرة أخرى.'
      const errorData = error.response?.data
      
      if (errorData) {
        errorMessage = errorData.error || errorData.message || errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // If OTP is invalid or expired, clear the inputs and show message
      if (error.response?.status === 401 || error.response?.status === 400) {
        alert(errorMessage + '\n\nيرجى التحقق من الرمز وإعادة المحاولة.')
        // Clear OTP inputs
        setOtp(['', '', '', '', '', ''])
        // Focus first input
        setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 100)
      } else {
        alert(errorMessage)
      }
    }
  }

  const handleResend = async () => {
    if (timeLeft > 0) return
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'
      await axios.post(`${API_URL}/auth/otp/send`, { phone: phone })
      setTimeLeft(45)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (error) {
      console.error('Error resending OTP:', error)
      alert('فشل إعادة إرسال رمز المصادقة')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
          رمز المصادقة
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
      <div className="absolute content-stretch flex flex-col gap-[24px] items-center left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-10">
        {/* Message */}
        <div className="text-center w-full">
          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[14px] mb-1">
            تم ارسال رمز المصادقة علي الواتساب {phone}
          </p>
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-[#2d2871] text-[14px]">
            خلال {formatTime(timeLeft)}
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="content-stretch flex gap-[13px] items-start justify-center relative shrink-0 w-full">
          {otp.map((digit, index) => (
            <div
              key={index}
              className={`bg-[#fff8fa] border-2 border-solid content-stretch flex flex-col items-center justify-center p-[10px] relative rounded-[12px] shrink-0 w-[47px] h-[56px] transition-all ${
                digit ? 'border-[#dbd9f2] bg-white' : 'border-transparent'
              }`}
            >
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#121212] text-[20px] font-bold text-center w-full outline-none bg-transparent"
              />
            </div>
          ))}
        </div>

        {/* Resend Link */}
        <div className="content-stretch flex gap-[7px] items-center justify-center leading-[1.5] relative shrink-0 text-[14px]">
          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-[#121212] text-center">
            لم يصل اليك الكود؟
          </p>
          <button
            onClick={handleResend}
            disabled={timeLeft > 0}
            className={`font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] relative shrink-0 ${
              timeLeft > 0 ? 'text-[#999] cursor-not-allowed' : 'text-[#2d2871] cursor-pointer hover:underline'
            }`}
            style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}
          >
            إعادة الأرسال
          </button>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="absolute content-stretch flex flex-col items-center left-0 bottom-0 w-[390px] z-10">
        <button
          onClick={handleSubmit}
          disabled={otp.join('').length !== 6}
          className="bg-[#2d2871] content-stretch cursor-pointer flex h-[50px] items-center justify-center p-[10px] relative rounded-[63px] shrink-0 w-[350px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1f1a5a] transition-colors"
        >
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-left text-white" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            متابعة التسجيل
          </p>
        </button>
        <div className="h-[35px] relative shrink-0 w-full">
          <div className="absolute bg-[rgba(27,27,27,0.85)] inset-[55.88%_32%_29.41%_32.27%] rounded-[2.5px]"></div>
        </div>
      </div>
    </div>
  )
}

export default OTP
