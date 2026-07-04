import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'
import { FiBell, FiCheck, FiX } from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Notifications() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const notificationsFetchedRef = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
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
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        navigate('/login')
        return
      }
      const response = await axios.get(`${API_URL}/mobile/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      })
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Set empty state on error
      setNotifications([])
      setUnreadCount(0)
      if (error.response?.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`${API_URL}/mobile/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
    } else if (notification.category === 'BOOKING') {
      navigate('/booking')
    }
  }

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      <StatusBar />

      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-1/2 top-[66px] translate-x-[-50%] w-[350px]">
        <div className="content-stretch flex items-center justify-center opacity-0 relative shrink-0 size-[32px]"></div>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          الإشعارات
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center relative shrink-0 size-[32px]"
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
      <div className="absolute content-stretch flex flex-col gap-[18px] items-start left-[20px] top-[118px] w-[350px] overflow-y-auto pb-[100px]">
        {loading ? (
          <div className="flex items-center justify-center py-20 w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2d2871]"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[12px] items-center justify-center p-[40px] relative rounded-[16px] shrink-0 w-full">
            <FiBell className="w-16 h-16 text-gray-400" />
            <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#666] text-[16px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              لا توجد إشعارات
            </p>
          </div>
        ) : (
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white border border-[#f2f2f2] border-solid content-stretch cursor-pointer flex gap-[12px] items-start justify-end overflow-clip p-[16px] relative rounded-[16px] shrink-0 w-full transition-colors hover:bg-gray-50 ${
                  !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                  !notification.isRead ? 'bg-[#2d2871]' : 'bg-gray-300'
                }`}></div>
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-end min-h-px min-w-px relative shrink-0">
                  <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!notification.isRead) {
                          markAsRead(notification.id)
                        }
                      }}
                      className={`flex items-center justify-center relative shrink-0 size-[24px] ${
                        !notification.isRead ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    >
                      <FiCheck className="w-4 h-4 text-[#2d2871]" />
                    </button>
                    <div className="content-stretch flex flex-col gap-[4px] items-end justify-center relative shrink-0">
                      <p className={`font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[14px] text-right ${
                        !notification.isRead ? 'text-[#121212] font-bold' : 'text-gray-700'
                      }`} style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                        {notification.titleAr || notification.title}
                      </p>
                      <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.4] relative shrink-0 text-[#666] text-[12px] text-right line-clamp-2" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                        {notification.messageAr || notification.message}
                      </p>
                      <p className="font-['Poppins:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#999] text-[10px] text-right mt-1">
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
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default Notifications

