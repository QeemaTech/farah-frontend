import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { formatImageSrc } from '../utils/imageUtils'
import { FiX } from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function MainHeader({ showNotifications = true, onAvatarClick }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const notificationRef = useRef(null)

  const notificationsFetchedRef = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated && showNotifications) {
      // Only fetch once on mount, then poll every 30 seconds
      if (!notificationsFetchedRef.current) {
        fetchNotifications()
        notificationsFetchedRef.current = true
      }
      
      // Poll for new notifications every 30 seconds
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          fetchNotifications()
        }, 30000)
      }
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      // Reset when not authenticated
      notificationsFetchedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAuthenticated, showNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationsDropdown(false)
      }
    }
    if (showNotificationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotificationsDropdown])

  const fetchNotifications = async () => {
    if (!isAuthenticated) return
    try {
      setLoadingNotifications(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setLoadingNotifications(false)
        return
      }
      const response = await axios.get(`${API_URL}/mobile/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10 },
        timeout: 5000
      })
      // Handle different response structures
      if (response.data) {
        let notificationsList = []
        if (Array.isArray(response.data)) {
          notificationsList = response.data
        } else {
          notificationsList = response.data.notifications || response.data.data || []
        }
        setNotifications(notificationsList)
        // Calculate unread count - check both isRead and read properties
        const unread = notificationsList.filter(n => {
          // Check both isRead and read properties (backend might use either)
          return !(n.isRead || n.read)
        }).length
        setUnreadCount(unread)
      } else {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error.response?.data || error.message)
      // If 401 (Unauthorized) or "User not found", clear token and redirect to login
      if (error.response?.status === 401 || error.response?.data?.error === 'User not found') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Don't redirect immediately, let the user continue browsing
        // The ProtectedRoute will handle redirect if needed
      }
      // Set empty state on error
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      await axios.patch(`${API_URL}/mobile/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      })
      // Update local state immediately for better UX
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true, read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
      // Also refresh to get latest from server
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error.response?.data || error.message)
    }
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    if (notification.link) {
      navigate(notification.link)
      setShowNotificationsDropdown(false)
    }
  }

  const handleAvatarClick = () => {
    if (onAvatarClick) {
      onAvatarClick()
    } else {
      navigate('/profile')
    }
  }

  // Format avatar source - handle URLs, relative paths, and base64
  const getAvatarSrc = () => {
    if (!user?.avatar) return null
    
    // If it's already a full URL, use it directly
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar
    }
    
    // If it starts with /uploads/, construct full URL
    if (user.avatar.startsWith('/uploads/')) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'
      const baseUrl = API_URL.replace('/api', '')
      return `${baseUrl}${user.avatar}`
    }
    
    // Otherwise, use formatImageSrc utility
    return formatImageSrc(user.avatar)
  }
  
  const avatarSrc = getAvatarSrc()
  
  // Create a unique key based on avatar to force re-render when it changes
  const avatarKey = user?.avatar 
    ? `avatar-${user.id}-${user.avatar.length}-${user.avatar.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '')}` 
    : `avatar-${user?.id || 'default'}-no-avatar`

  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-0 top-[20px] w-[390px] z-10">
      <div className="content-stretch flex items-center justify-between px-[20px] py-0 relative shrink-0 w-full">
        {/* User Info Section */}
        <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
          <div 
            className="relative rounded-[50px] shadow-[0px_4px_10px_0px_rgba(17,28,48,0.2)] shrink-0 size-[50px] cursor-pointer"
            onClick={handleAvatarClick}
          >
            <div className="absolute bg-[#f8d3dd] inset-0 rounded-[50px] flex items-center justify-center z-0">
              <span className="text-[#2d2871] text-xl font-bold">
                {(user?.nameAr || user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Render image if we have a valid source */}
            {avatarSrc ? (
              <img
                key={avatarKey}
                src={avatarSrc}
                alt="Profile"
                className="absolute max-w-none object-cover rounded-[50px] size-full z-10"
                crossOrigin="anonymous"
                onError={(e) => {
                  // Hide image on error, fallback will show
                  if (e.target) {
                    e.target.style.display = 'none'
                  }
                }}
                onLoad={() => {
                  // Image loaded successfully
                }}
              />
            ) : null}
          </div>
          <div className="content-stretch flex flex-col gap-[5px] items-end justify-center relative shrink-0">
            <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#141414] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              {user?.nameAr || user?.name || 'مستخدم'}
            </p>
            <div className="content-stretch flex items-center justify-center relative shrink-0">
              <div className="content-stretch flex gap-[5px] items-center justify-center relative shrink-0">
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#4d4d4d] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {user?.locationAr || user?.location || 'السعودية'}
                </p>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1C5.24 1 3 3.24 3 6C3 10.5 8 15 8 15C8 15 13 10.5 13 6C13 3.24 10.76 1 8 1Z"
                    stroke="#4D4D4D"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 8.5C8.83 8.5 9.5 7.83 9.5 7C9.5 6.17 8.83 5.5 8 5.5C7.17 5.5 6.5 6.17 6.5 7C6.5 7.83 7.17 8.5 8 8.5Z"
                    stroke="#4D4D4D"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Icon with Dropdown */}
        {showNotifications && (
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setShowNotificationsDropdown(!showNotificationsDropdown)
                  if (!showNotificationsDropdown) {
                    fetchNotifications()
                  }
                } else {
                  navigate('/login')
                }
              }}
              className="bg-white content-stretch flex items-center justify-center p-[10px] relative rounded-[12px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.2)] shrink-0 size-[32px] cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9C5 14.25 2 16 2 16H22C22 16 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
                  stroke="#121212"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 21C9 22.1 9.9 23 11 23H13C14.1 23 15 22.1 15 21"
                  stroke="#121212"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isAuthenticated && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotificationsDropdown && isAuthenticated && (
              <div className="absolute top-[45px] right-0 w-[320px] bg-white rounded-[16px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.3)] z-[100] max-h-[400px] overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-[16px] text-[#121212]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                    الإشعارات
                  </h3>
                  <button
                    onClick={() => setShowNotificationsDropdown(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                {loadingNotifications ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2d2871] mx-auto"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-gray-300">
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9C5 14.25 2 16 2 16H22C22 16 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 21C9 22.1 9.9 23 11 23H13C14.1 23 15 22.1 15 21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-sm">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const isUnread = !notification.isRead && !notification.read
                      return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isUnread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            isUnread ? 'bg-[#2d2871]' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] text-[14px] mb-1 ${
                              isUnread ? 'text-[#121212] font-bold' : 'text-gray-700'
                            }`} style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                              {notification.titleAr || notification.title}
                            </p>
                            <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[12px] text-gray-500 line-clamp-2" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                              {notification.messageAr || notification.message}
                            </p>
                            <p className="font-['Poppins:Regular',sans-serif] text-[10px] text-gray-400 mt-1">
                              {new Date(notification.createdAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
                {notifications.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        navigate('/profile/notifications')
                        setShowNotificationsDropdown(false)
                      }}
                      className="w-full text-center text-[#2d2871] font-['Poppins:Medium','Noto_Sans_Arabic:Medium',sans-serif] text-[14px] hover:underline"
                      style={{ fontVariationSettings: "'wdth' 100, 'wght' 500" }}
                    >
                      عرض جميع الإشعارات
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MainHeader

