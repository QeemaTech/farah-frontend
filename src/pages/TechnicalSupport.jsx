import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import MainHeader from '../components/MainHeader'
import BottomNavigation from '../components/BottomNavigation'
import { FiMail, FiPhone, FiMessageCircle, FiSend, FiClock, FiMapPin } from 'react-icons/fi'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function TechnicalSupport() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState(null)
  const [formData, setFormData] = useState({
    name: user?.nameAr || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: '',
    message: '',
  })
  const [sending, setSending] = useState(false)

  const settingsFetchedRef = useRef(false)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Fetch settings only once
    if (settingsFetchedRef.current || fetchingRef.current) {
      return
    }

    const fetchSettings = async () => {
      fetchingRef.current = true
      try {
        const response = await axios.get(`${API_URL}/mobile/settings`, {
          timeout: 5000
        })
        setSettings(response.data.settings)
        settingsFetchedRef.current = true
      } catch (error) {
        console.error('Error fetching settings:', error)
        settingsFetchedRef.current = true
      } finally {
        fetchingRef.current = false
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSending(true)
      // In production, send to backend API
      // await axios.post(`${API_URL}/support`, formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(language === 'ar' 
        ? 'تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.' 
        : 'Your message has been sent successfully. We will contact you soon.')
      
      setFormData(prev => ({
        ...prev,
        subject: '',
        message: '',
      }))
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(language === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send message')
    } finally {
      setSending(false)
    }
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
            {language === 'ar' ? 'الدعم الفني' : 'Technical Support'}
          </p>
          <div className="w-[32px]"></div>
        </div>

        {/* Main Content */}
        <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[20px] top-[140px] w-[350px] overflow-y-auto pb-[120px]">
          {/* Contact Information Card */}
          {settings && (
            <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[16px] items-start p-[20px] relative rounded-[16px] shrink-0 w-full">
              <h2 className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[16px] text-right w-full" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
              </h2>
              
              {settings.email && (
                <div className="bg-[#fff8fa] border border-[#e6e6e6] border-solid content-stretch flex gap-[12px] items-center p-[16px] relative rounded-[12px] shrink-0 w-full">
                  <FiMail className="w-5 h-5 text-[#2d2871] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[12px] mb-1">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </p>
                    <a href={`mailto:${settings.email}`} className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#2d2871] text-[14px] hover:underline">
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}

              {settings.phone && (
                <div className="bg-[#fff8fa] border border-[#e6e6e6] border-solid content-stretch flex gap-[12px] items-center p-[16px] relative rounded-[12px] shrink-0 w-full">
                  <FiPhone className="w-5 h-5 text-[#2d2871] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[12px] mb-1">
                      {language === 'ar' ? 'الهاتف' : 'Phone'}
                    </p>
                    <a href={`tel:${settings.phone}`} className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#2d2871] text-[14px] hover:underline">
                      {settings.phone}
                    </a>
                  </div>
                </div>
              )}

              {settings.address && (
                <div className="bg-[#fff8fa] border border-[#e6e6e6] border-solid content-stretch flex gap-[12px] items-center p-[16px] relative rounded-[12px] shrink-0 w-full">
                  <FiMapPin className="w-5 h-5 text-[#2d2871] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[12px] mb-1">
                      {language === 'ar' ? 'العنوان' : 'Address'}
                    </p>
                    <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
                      {language === 'ar' ? settings.addressAr || settings.address : settings.address || settings.addressAr}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-[#fff8fa] border border-[#e6e6e6] border-solid content-stretch flex gap-[12px] items-center p-[16px] relative rounded-[12px] shrink-0 w-full">
                <FiClock className="w-5 h-5 text-[#2d2871] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[12px] mb-1">
                    {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                  </p>
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
                    24/7
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Form Card */}
          <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[20px] items-start p-[20px] relative rounded-[16px] shrink-0 w-full">
            <h2 className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[16px] text-right w-full" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              {language === 'ar' ? 'أرسل لنا رسالة' : 'Send us a Message'}
            </h2>
            
            <form onSubmit={handleSubmit} className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px] text-right w-full">
                  {language === 'ar' ? 'الاسم' : 'Name'} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                  required
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px] text-right w-full">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                  required
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px] text-right w-full">
                  {language === 'ar' ? 'الهاتف' : 'Phone'}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px] text-right w-full">
                  {language === 'ar' ? 'الموضوع' : 'Subject'} *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                  required
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px] text-right w-full">
                  {language === 'ar' ? 'الرسالة' : 'Message'} *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex items-start min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors resize-none"
                  required
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="bg-[#2d2871] content-stretch cursor-pointer flex h-[55px] items-center justify-center gap-[8px] px-[16px] py-[12px] relative rounded-[38px] shrink-0 w-full hover:bg-[#1f1a5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend className="w-5 h-5 text-white" />
                <span className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-white text-[16px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                  {sending 
                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                    : (language === 'ar' ? 'إرسال' : 'Send')
                  }
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </>
  )
}

export default TechnicalSupport
