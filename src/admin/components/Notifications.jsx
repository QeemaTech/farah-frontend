import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCircle, X, Trash2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Notifications() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    const interval = setInterval(() => {
      fetchUnreadCount()
      if (showDropdown) fetchNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [showDropdown])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) return
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10 },
      })
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
      }
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) return
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUnreadCount(response.data.count || 0)
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
      }
    }
  }

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) return
      await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchNotifications()
      fetchUnreadCount()
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
      } else {
        toast.error(t('notifications.markReadFailed'))
      }
    }
  }

  const markAllAsRead = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      if (!token) return
      await axios.patch(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchNotifications()
      fetchUnreadCount()
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
      } else {
        toast.error(t('notifications.markAllFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (id, e) => {
    e.stopPropagation()
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) return
      await axios.delete(`${API_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchNotifications()
      fetchUnreadCount()
      toast.success(t('notifications.deleted'))
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
      } else {
        toast.error(t('notifications.deleteFailed'))
      }
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
      setShowDropdown(false)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case 'WARNING':
        return <span className="text-amber-500">⚠</span>
      case 'ERROR':
        return <span className="text-red-500">✕</span>
      default:
        return <span className="text-[var(--admin-accent)]">ℹ</span>
    }
  }

  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative flex h-10 w-10 items-center justify-center rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:bg-[var(--admin-bg)]"
        aria-label={t('notifications.title')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute start-0 z-50 mt-2 flex max-h-[600px] w-[min(100vw-2rem,24rem)] flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-dropdown)]">
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] p-4">
              <h3 className="text-lg font-bold text-[var(--admin-text)]">{t('notifications.title')}</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-sm font-medium text-[var(--admin-accent)] hover:underline disabled:opacity-50"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[var(--admin-text-muted)]">
                  <Bell className="mx-auto mb-2 h-12 w-12 opacity-30" />
                  <p>{t('notifications.empty')}</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--admin-border)]">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`cursor-pointer p-4 transition-colors hover:bg-[var(--admin-bg)] ${
                        !notification.isRead ? 'bg-[#6366f1]/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-sm font-semibold ${
                                !notification.isRead ? 'text-[var(--admin-text)]' : 'text-[var(--admin-text-muted)]'
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--admin-accent)]" />
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-[var(--admin-text-muted)]">
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-[var(--admin-text-muted)]">
                              {new Date(notification.createdAt).toLocaleString(locale, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => deleteNotification(notification.id, e)}
                              className="text-[var(--admin-text-muted)] hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-[var(--admin-border)] p-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/admin/notifications')
                    setShowDropdown(false)
                  }}
                  className="text-sm font-medium text-[var(--admin-accent)] hover:underline"
                >
                  {t('notifications.viewAll')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Notifications
