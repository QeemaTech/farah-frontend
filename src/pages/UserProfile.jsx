import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { FiEdit, FiTrash2, FiSave, FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCamera } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { formatImageSrc } from '../utils/imageUtils'
import MainHeader from '../components/MainHeader'
import BottomNavigation from '../components/BottomNavigation'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function UserProfile() {
  const { user, logout, updateUser } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    location: '',
    locationAr: '',
    avatar: '',
  })
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0) // Force image reload
  const fileInputRef = useRef(null)

  const profileFetchedRef = useRef(false)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Only fetch if user exists and we haven't fetched yet
    if (!user || profileFetchedRef.current || fetchingRef.current) {
      return
    }

    fetchUserProfile()
  }, [user?.id]) // Only depend on user.id, not the whole user object

  const fetchUserProfile = async () => {
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

      const response = await axios.get(`${API_URL}/mobile/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      })

      if (response.data && response.data.success && response.data.user) {
        const userData = response.data.user
        
        setFormData(prev => ({
          name: userData.name || '',
          nameAr: userData.nameAr || '',
          email: userData.email || '',
          phone: userData.phone || '',
          location: userData.location || '',
          locationAr: userData.locationAr || '',
          // Always update avatar from server data
          avatar: userData.avatar || '',
        }))
        
        // Always update AuthContext with fresh data
        updateUser(userData)
        profileFetchedRef.current = true
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول مرة أخرى' : 'Please login again')
        logout()
        navigate('/login')
      } else {
        toast.error(language === 'ar' ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile')
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (file) => {
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? 'الملف المحدد ليس صورة' : 'Selected file is not an image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5MB)' : 'Image size is too large (max 5MB)')
      return
    }

    // Store file for upload (new method - file upload)
    setFormData(prev => ({ ...prev, avatarFile: file }))
    
    // Also create preview using FileReader for immediate display
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (result && typeof result === 'string') {
        // Store preview as base64 for immediate display
        setFormData(prev => ({ ...prev, avatar: result }))
        setAvatarUpdateKey(prev => prev + 1) // Force image reload
      }
    }
    reader.onerror = () => {
      toast.error(language === 'ar' ? 'فشل قراءة الصورة' : 'Failed to read image')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
        navigate('/login')
        return
      }

      // Prepare FormData for file upload
      const formDataToSend = new FormData()
      
      // Add text fields
      if (formData.name) formDataToSend.append('name', formData.name.trim())
      if (formData.nameAr) formDataToSend.append('nameAr', formData.nameAr.trim())
      if (formData.email) formDataToSend.append('email', formData.email.trim())
      if (formData.phone) formDataToSend.append('phone', formData.phone.trim())
      if (formData.location !== undefined) formDataToSend.append('location', formData.location?.trim() || '')
      if (formData.locationAr !== undefined) formDataToSend.append('locationAr', formData.locationAr?.trim() || '')
      
      // Add avatar file if uploaded, otherwise send base64 (backward compatibility)
      if (formData.avatarFile) {
        formDataToSend.append('avatar', formData.avatarFile)
      } else if (formData.avatar) {
        // Fallback to base64 for backward compatibility
        formDataToSend.append('avatar', formData.avatar)
      }

      // Validate required fields
      if (!formData.name && !formData.nameAr) {
        toast.error(language === 'ar' ? 'الرجاء إدخال الاسم' : 'Please enter a name')
        setLoading(false)
        return
      }

      if (!formData.phone) {
        toast.error(language === 'ar' ? 'الرجاء إدخال رقم الهاتف' : 'Please enter phone number')
        setLoading(false)
        return
      }

      const response = await axios.patch(
        `${API_URL}/mobile/profile`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' // Important for file uploads
          },
          timeout: 30000 // 30 seconds timeout for large images
        }
      )


      // Check if response is successful
      if (response.data && response.data.success && response.data.user) {
        const updatedUser = response.data.user
        
        
        // Update AuthContext with new user data first - this will update MainHeader
        updateUser(updatedUser)
        
        // Update formData to reflect changes immediately, ensuring avatar is included
        setFormData(prev => {
          const newFormData = {
            ...prev,
            name: updatedUser.name || prev.name,
            nameAr: updatedUser.nameAr || prev.nameAr,
            email: updatedUser.email || prev.email,
            phone: updatedUser.phone || prev.phone,
            location: updatedUser.location !== undefined ? updatedUser.location : prev.location,
            locationAr: updatedUser.locationAr !== undefined ? updatedUser.locationAr : prev.locationAr,
            // Always use the avatar from server response (even if null)
            avatar: updatedUser.avatar !== undefined && updatedUser.avatar !== null ? updatedUser.avatar : (updatedUser.avatar === null ? '' : prev.avatar),
          }
          return newFormData
        })
        
        // Force image reload by updating the key
        setAvatarUpdateKey(prev => {
          const newKey = prev + 1
          return newKey
        })

        toast.success(language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully')
        setEditing(false)
        
        // Don't refetch immediately - we already have the updated data
        // The state updates should be enough to trigger re-renders
        // Only refetch if needed after a longer delay
        setTimeout(() => {
          // Check if avatar is actually set
          if (!updatedUser.avatar) {
            profileFetchedRef.current = false
            fetchUserProfile()
          }
        }, 500)
      } else {
        throw new Error(response.data?.error || 'Invalid response from server')
      }
    } catch (error) {
      
      let errorMessage = language === 'ar' ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile'
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = language === 'ar' ? 'لا يمكن الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت' : 'Cannot connect to server. Please check your internet connection'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(language === 'ar' 
      ? 'هل أنت متأكد من حذف حسابك؟ سيتم حذف جميع بياناتك بشكل نهائي.' 
      : 'Are you sure you want to delete your account? All your data will be permanently deleted.')) {
      return
    }

    try {
      setDeleting(true)
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/mobile/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(language === 'ar' ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully')
      logout()
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل حذف الحساب' : 'Failed to delete account'))
    } finally {
      setDeleting(false)
    }
  }

  // Memoize avatar source to prevent unnecessary recalculations
  // MUST be before any conditional returns to follow Rules of Hooks
  const avatarSrc = useMemo(() => {
    if (!formData.avatar) return null
    
    // If avatar is already a URL (starts with http:// or https://), use it directly
    if (formData.avatar.startsWith('http://') || formData.avatar.startsWith('https://')) {
      return formData.avatar
    }
    
    // If it starts with /uploads/, construct full URL
    if (formData.avatar.startsWith('/uploads/')) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'
      const baseUrl = API_URL.replace('/api', '')
      return `${baseUrl}${formData.avatar}`
    }
    
    // Otherwise, format it (handles base64, relative paths, etc.)
    return formatImageSrc(formData.avatar)
  }, [formData.avatar])
  
  // Create a unique key based on avatar and update key to force re-render when it changes
  // MUST be before any conditional returns to follow Rules of Hooks
  const avatarKey = useMemo(() => {
    if (formData.avatar) {
      return `profile-avatar-${avatarUpdateKey}-${formData.avatar.length}-${formData.avatar.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '')}`
    }
    return `profile-avatar-${avatarUpdateKey}-default`
  }, [formData.avatar, avatarUpdateKey])
  
  const displayName = language === 'ar' ? (formData.nameAr || formData.name) : (formData.name || formData.nameAr)
  const displayLocation = language === 'ar' ? (formData.locationAr || formData.location) : (formData.location || formData.locationAr)
  

  if (loading) {
    return (
      <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-[#2d2871] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
        {/* Decorative Background */}
        <div className="absolute contents left-[-249px] top-[25px] pointer-events-none">
          <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[43.71px] w-[1314.758px] opacity-10">
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
            {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
          </p>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center justify-center relative shrink-0 size-[32px] bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              <FiEdit className="w-5 h-5 text-[#2d2871]" />
            </button>
          ) : (
            <button
              onClick={() => {
                setEditing(false)
                fetchUserProfile()
              }}
              className="flex items-center justify-center relative shrink-0 size-[32px] bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              <FiX className="w-5 h-5 text-[#121212]" />
            </button>
          )}
        </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[24px] items-center left-1/2 top-[140px] translate-x-[-50%] w-[350px] z-[1] pb-[200px]">
        {!editing ? (
          <>
            {/* Avatar */}
            <div className="content-stretch flex flex-col items-center gap-[16px] relative shrink-0 w-full">
              <div className="relative">
                {/* Render img tag only if we have a valid avatar source (URL or valid base64) */}
                {avatarSrc ? (
                  <img 
                    key={avatarKey}
                    src={avatarSrc}
                    alt={displayName} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#2d2871]"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      if (e.target && e.target.parentNode) {
                        e.target.style.display = 'none'
                        const fallback = e.target.nextElementSibling
                        if (fallback) {
                          fallback.style.display = 'flex'
                        }
                      }
                    }}
                    onLoad={() => {}}
                  />
                ) : null}
                {/* Fallback avatar icon - show when no avatar or image fails */}
                <div 
                  className={`w-32 h-32 rounded-full bg-gradient-to-br from-[#2d2871] to-[#1f1a5a] flex items-center justify-center border-4 border-[#2d2871] ${(avatarSrc || formData.avatar) ? 'hidden' : ''}`}
                  style={{ display: (avatarSrc || formData.avatar) ? 'none' : 'flex' }}
                >
                  <FiUser className="w-16 h-16 text-white" />
                </div>
              </div>
              <h2 className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-[#121212] text-[20px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {displayName || (language === 'ar' ? 'مستخدم' : 'User')}
              </h2>
            </div>

            {/* User Info */}
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
              <div className="bg-[#fff8fa] border border-[#e6e6e6] border-solid content-stretch flex gap-[12px] items-center p-[16px] relative rounded-[12px] shrink-0 w-full">
                <FiMail className="w-5 h-5 text-[#2d2871] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[12px] mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </p>
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px] truncate">
                    {formData.email || '-'}
                  </p>
                </div>
              </div>

              <div className="bg-[#fff8fa] border border-[#e6e6e6] border-solid content-stretch flex gap-[12px] items-center p-[16px] relative rounded-[12px] shrink-0 w-full">
                <FiPhone className="w-5 h-5 text-[#2d2871] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[12px] mb-1">
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </p>
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px] truncate">
                    {formData.phone || '-'}
                  </p>
                </div>
              </div>

              <div className="bg-[#fff8fa] border border-[#e6e6e6] border-solid content-stretch flex gap-[12px] items-center p-[16px] relative rounded-[12px] shrink-0 w-full">
                <FiMapPin className="w-5 h-5 text-[#2d2871] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[12px] mb-1">
                    {language === 'ar' ? 'الموقع' : 'Location'}
                  </p>
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px] truncate">
                    {displayLocation || '-'}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
            {/* Avatar Upload */}
            <div className="content-stretch flex flex-col items-center gap-[16px] relative shrink-0 w-full">
              <div className="relative">
                {/* Always render img tag - use formData.avatar directly if formatImageSrc returns null */}
                {avatarSrc ? (
                  <img 
                    key={avatarKey}
                    src={avatarSrc}
                    alt="Avatar" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#2d2871]"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      if (e.target && e.target.parentNode) {
                        e.target.style.display = 'none'
                        const fallback = e.target.nextElementSibling
                        if (fallback) {
                          fallback.style.display = 'flex'
                        }
                      }
                    }}
                    onLoad={() => {}}
                  />
                ) : null}
                {/* Fallback avatar icon - show when no avatar or image fails */}
                <div 
                  className={`w-32 h-32 rounded-full bg-gradient-to-br from-[#2d2871] to-[#1f1a5a] flex items-center justify-center border-4 border-[#2d2871] ${(avatarSrc || formData.avatar) ? 'hidden' : ''}`}
                  style={{ display: (avatarSrc || formData.avatar) ? 'none' : 'flex' }}
                >
                  <FiUser className="w-16 h-16 text-white" />
                </div>
                <label className="absolute bottom-0 right-0 bg-[#2d2871] text-white p-2 rounded-full cursor-pointer hover:bg-[#1f1a5a] transition-colors shadow-lg">
                  <FiCamera className="w-5 h-5" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
                  {language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                  required
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
                  {language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}
                </label>
                <input
                  type="text"
                  name="nameAr"
                  value={formData.nameAr}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                  dir="rtl"
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
                  {language === 'ar' ? 'الهاتف' : 'Phone'}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
                  {language === 'ar' ? 'الموقع (إنجليزي)' : 'Location (English)'}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                />
              </div>

              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <label className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[14px]">
                  {language === 'ar' ? 'الموقع (عربي)' : 'Location (Arabic)'}
                </label>
                <input
                  type="text"
                  name="locationAr"
                  value={formData.locationAr}
                  onChange={handleChange}
                  className="bg-white border border-[#e6e6e6] border-solid content-stretch flex h-[52px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 w-full outline-none focus:border-[#2d2871] focus:ring-2 focus:ring-[#2d2871]/20 transition-colors"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  fetchUserProfile()
                }}
                className="flex-1 bg-white border border-[#e6e6e6] border-solid content-stretch cursor-pointer flex h-[50px] items-center justify-center gap-[8px] px-[16px] py-[12px] relative rounded-[63px] shrink-0 hover:bg-gray-50 transition-colors"
              >
                <FiX className="w-5 h-5 text-[#121212]" />
                <span className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[#121212] text-[16px]">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </span>
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#2d2871] content-stretch cursor-pointer flex h-[50px] items-center justify-center gap-[8px] px-[16px] py-[12px] relative rounded-[63px] shrink-0 hover:bg-[#1f1a5a] transition-colors"
              >
                <FiSave className="w-5 h-5 text-white" />
                <span className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-white text-[16px]">
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Delete Account Button */}
        {!editing && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 content-stretch cursor-pointer flex h-[50px] items-center justify-center gap-[8px] px-[16px] py-[12px] relative rounded-[63px] shrink-0 w-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-[1]"
          >
            <FiTrash2 className="w-5 h-5 text-white" />
            <span className="font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-white text-[16px]">
              {deleting 
                ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...')
                : (language === 'ar' ? 'حذف الحساب' : 'Delete Account')
              }
            </span>
          </button>
        )}
      </div>

    </div>
      {/* Bottom Navigation */}
      <BottomNavigation />
    </>
  )
}

export default UserProfile
