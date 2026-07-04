import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { shareApp, shareToPlatform, getShareLinks } from '../utils/shareApp'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  FiShare2, 
  FiCopy, 
  FiMessageCircle, 
  FiMail,
  FiFacebook,
  FiTwitter
} from 'react-icons/fi'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function ShareApp({ className = '' }) {
  const { language } = useLanguage()
  const [settings, setSettings] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(true)

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
        const response = await axios.get(`${API_URL}/settings`, {
          timeout: 5000
        })
        setSettings(response.data.settings)
        settingsFetchedRef.current = true
      } catch (error) {
        settingsFetchedRef.current = true
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    }
    fetchSettings()
  }, [])

  const handleShare = async () => {
    if (!settings) return

    const result = await shareApp(settings, language)
    
    if (result.success) {
      if (result.method === 'clipboard') {
        toast.success(result.message || (language === 'ar' ? 'تم نسخ الرابط' : 'Link copied'))
      } else {
        toast.success(language === 'ar' ? 'تم المشاركة بنجاح' : 'Shared successfully')
      }
      setShowMenu(false)
    } else {
      toast.error(result.error || (language === 'ar' ? 'فشل المشاركة' : 'Failed to share'))
    }
  }

  const handlePlatformShare = (platform) => {
    if (!settings) return

    const result = shareToPlatform(platform, settings, language)
    
    if (result.success) {
      toast.success(language === 'ar' ? 'تم فتح نافذة المشاركة' : 'Share window opened')
    } else {
      toast.error(result.error || (language === 'ar' ? 'فشل المشاركة' : 'Failed to share'))
    }
    
    setShowMenu(false)
  }

  const handleCopyLink = async () => {
    if (!settings) return

    const shareText = language === 'ar' 
      ? `${settings.shareMessageAr}\n${window.location.origin}`
      : `${settings.shareMessage}\n${window.location.origin}`

    try {
      await navigator.clipboard.writeText(shareText)
      toast.success(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard')
      setShowMenu(false)
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل نسخ الرابط' : 'Failed to copy link')
    }
  }

  if (loading || !settings) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2d2871] to-[#1f1a5a] text-white rounded-lg hover:from-[#1f1a5a] hover:to-[#2d2871] transition-all"
      >
        <FiShare2 className="w-5 h-5" />
        <span>{language === 'ar' ? 'مشاركة التطبيق' : 'Share App'}</span>
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 animate-fade-in">
            <div className="space-y-2">
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <FiShare2 className="w-5 h-5 text-[#2d2871]" />
                <span className="flex-1">{language === 'ar' ? 'مشاركة' : 'Share'}</span>
              </button>
              
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <FiCopy className="w-5 h-5 text-[#2d2871]" />
                <span className="flex-1">{language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}</span>
              </button>

              <div className="border-t border-gray-200 my-2" />

              <button
                onClick={() => handlePlatformShare('whatsapp')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <FiMessageCircle className="w-5 h-5 text-green-600" />
                <span className="flex-1">WhatsApp</span>
              </button>

              <button
                onClick={() => handlePlatformShare('facebook')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <FiFacebook className="w-5 h-5 text-blue-600" />
                <span className="flex-1">Facebook</span>
              </button>

              <button
                onClick={() => handlePlatformShare('twitter')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <FiTwitter className="w-5 h-5 text-blue-400" />
                <span className="flex-1">Twitter</span>
              </button>

              <button
                onClick={() => handlePlatformShare('telegram')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <FiMessageCircle className="w-5 h-5 text-blue-500" />
                <span className="flex-1">Telegram</span>
              </button>

              <button
                onClick={() => handlePlatformShare('email')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <FiMail className="w-5 h-5 text-gray-600" />
                <span className="flex-1">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
              </button>

              <button
                onClick={() => handlePlatformShare('sms')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <FiMessageCircle className="w-5 h-5 text-gray-600" />
                <span className="flex-1">SMS</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ShareApp


