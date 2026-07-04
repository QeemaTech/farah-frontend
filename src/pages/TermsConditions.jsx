import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import MainHeader from '../components/MainHeader'
import BottomNavigation from '../components/BottomNavigation'
import { FiFileText } from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function TermsConditions() {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchTerms()
  }, [])

  const fetchTerms = async () => {
    try {
      const response = await axios.get(`${API_URL}/mobile/content/terms`)
      setContent(response.data.content || '')
    } catch (error) {
      console.error('Error fetching terms:', error)
      setContent(language === 'ar' 
        ? 'لا توجد شروط وأحكام متاحة حالياً.' 
        : 'No terms and conditions available at the moment.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto flex items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-[#2d2871] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <BottomNavigation />
      </>
    )
  }

  return (
    <>
      <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
        {/* Decorative Background */}
        <div className="absolute contents left-[-249px] top-[-335px] pointer-events-none">
          <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
            <div className="h-[342.961px] relative w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Main Header */}
        <MainHeader showNotifications={false} />

        {/* Page Header */}
        <div className="absolute content-stretch flex items-center justify-between left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-10">
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
            {language === 'ar' ? 'شروط الاستخدام' : 'Terms & Conditions'}
          </p>
          <div className="w-[32px]"></div>
        </div>

        {/* Main Content */}
        <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[20px] top-[140px] w-[350px] overflow-y-auto pb-[120px]">
          {/* Icon Card */}
          <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-center justify-center p-[24px] relative rounded-[16px] shrink-0 w-full">
            <div className="bg-[#edecf8] rounded-full p-4">
              <FiFileText className="w-8 h-8 text-[#2d2871]" />
            </div>
            <h1 className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[20px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              {language === 'ar' ? 'شروط الاستخدام' : 'Terms & Conditions'}
            </h1>
          </div>

          {/* Content Card */}
          <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-start p-[20px] relative rounded-[16px] shrink-0 w-full">
            <div 
              className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.8] relative shrink-0 text-[#666] text-[14px] text-right w-full whitespace-pre-wrap"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}
            >
              {content || (language === 'ar' 
                ? 'لا توجد شروط وأحكام متاحة حالياً. سيتم تحديث هذه الصفحة قريباً.' 
                : 'No terms and conditions available at the moment. This page will be updated soon.')}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </>
  )
}

export default TermsConditions
