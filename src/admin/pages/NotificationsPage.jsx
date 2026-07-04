import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import { Check, Trash2, CircleCheck, Bell, AlertTriangle, Info, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Pagination from '../components/Pagination'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_URL } from '../utils/adminSession'
import { AdminContent, Badge, UiCard, UiStat, UiStats } from '../design-system'


function NotificationsPage() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRead, setFilterRead] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 20,
    totalPages: 0
  })

  useEffect(() => {
    fetchNotifications()
  }, [filterRead, filterCategory, pagination.currentPage])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          isRead: filterRead || undefined,
          category: filterCategory || undefined,
          limit: pagination.limit,
          offset
        }
      })
      setNotifications(response.data.notifications || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit)
      }))
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error(t('loadFailed', { ar: 'فشل تحميل الإشعارات', en: 'Failed to load notifications' }))
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
      toast.success(t('notificationMarkedAsRead', { ar: 'تم تحديد الإشعار كمقروء', en: 'Notification marked as read' }))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error(t('updateFailed'))
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
      toast.success(t('allNotificationsMarkedAsRead', { ar: 'تم تحديد جميع الإشعارات كمقروءة', en: 'All notifications marked as read' }))
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error(t('updateFailed'))
    }
  }

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
      toast.success(t('notificationDeleted', { ar: 'تم حذف الإشعار', en: 'Notification deleted' }))
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error(t('deleteFailed'))
    }
  }

  const deleteAll = async () => {
    if (!confirm(t('confirmDeleteAll', { ar: 'هل أنت متأكد من حذف جميع الإشعارات؟', en: 'Are you sure you want to delete all notifications?' }))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { isRead: filterRead || undefined }
      })
      fetchNotifications()
      toast.success(t('allNotificationsDeleted', { ar: 'تم حذف جميع الإشعارات', en: 'All notifications deleted' }))
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      toast.error(t('deleteFailed'))
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <CircleCheck className="h-5 w-5 text-emerald-500" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-[var(--admin-accent)]" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getCategoryLabel = (category) => {
    const categoryMap = {
      BOOKING: t('booking'),
      PAYMENT: t('payment'),
      REVIEW: t('review'),
      SYSTEM: t('system', { ar: 'نظام', en: 'System' }),
      USER: t('user'),
      VENUE: t('venue'),
      SERVICE: t('service'),
      REPORT: t('report')
    }
    return categoryMap[category] || category
  }

  const ar = language === 'ar'
  const title = t('notifications', { ar: 'الإشعارات', en: 'Notifications' })
  const subtitle = ar ? 'متابعة تنبيهات النظام والحجوزات' : 'System and booking alerts'

  const toolbar = (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
      <select
        value={filterRead}
        onChange={(e) => {
          setFilterRead(e.target.value)
          setPagination((prev) => ({ ...prev, currentPage: 1 }))
        }}
        className="admin-input"
        dir={language}
      >
        <option value="">{t('allNotifications', { ar: 'جميع الإشعارات', en: 'All notifications' })}</option>
        <option value="false">{t('unread', { ar: 'غير مقروء', en: 'Unread' })}</option>
        <option value="true">{t('read', { ar: 'مقروء', en: 'Read' })}</option>
      </select>
      <select
        value={filterCategory}
        onChange={(e) => {
          setFilterCategory(e.target.value)
          setPagination((prev) => ({ ...prev, currentPage: 1 }))
        }}
        className="admin-input"
        dir={language}
      >
        <option value="">{t('allCategories')}</option>
        <option value="BOOKING">{t('booking')}</option>
        <option value="PAYMENT">{t('payment')}</option>
        <option value="REVIEW">{t('review')}</option>
        <option value="SYSTEM">{t('system', { ar: 'نظام', en: 'System' })}</option>
        <option value="USER">{t('user')}</option>
        <option value="VENUE">{t('venue')}</option>
        <option value="SERVICE">{t('service')}</option>
        <option value="REPORT">{t('report')}</option>
      </select>
    </div>
  )

  const headerActions = (
    <>
      <button type="button" onClick={markAllAsRead} className="ads-btn ads-btn-subtle gap-2">
        <Check className="h-4 w-4" />
        {t('markAllAsRead', { ar: 'تحديد الكل كمقروء', en: 'Mark all read' })}
      </button>
      <button type="button" onClick={deleteAll} className="ads-btn ads-btn-danger gap-2">
        <Trash2 className="h-4 w-4" />
        {t('deleteAll', { ar: 'حذف الكل', en: 'Delete all' })}
      </button>
    </>
  )

  return (
    <AdminPage
      title={title}
      subtitle={subtitle}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.notifications') },
      ]}
      action={headerActions}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={Bell} iconTone="indigo" value={pagination.total} label={t('notification')} />
          <UiStat icon={Bell} iconTone="amber" value={unreadCount} label={t('unread', { ar: 'غير مقروء', en: 'Unread' })} />
        </UiStats>
        <UiCard toolbar={toolbar} ariaLabel={title}>
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-[var(--admin-text-muted)]">
              <Bell className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>{t('noNotifications', { ar: 'لا توجد إشعارات', en: 'No notifications' })}</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--admin-border)]">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`cursor-pointer p-4 transition-colors hover:bg-[var(--admin-bg)] sm:p-5 ${
                    !notification.isRead ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-[var(--admin-text)]' : 'text-[var(--admin-text-muted)]'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead ? <span className="h-2 w-2 rounded-full bg-[var(--admin-accent)]" /> : null}
                        <Badge variant="neutral">{getCategoryLabel(notification.category)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{notification.message}</p>
                      <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
                        {new Date(notification.createdAt).toLocaleString(ar ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!notification.isRead ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="ads-btn ads-btn-icon ads-btn-subtle text-emerald-600"
                          title={t('markAsRead', { ar: 'تحديد كمقروء', en: 'Mark read' })}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="ads-btn ads-btn-icon ads-btn-subtle text-red-600"
                        title={t('delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pagination.totalPages > 0 ? (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, currentPage: page }))}
              total={pagination.total}
              limit={pagination.limit}
            />
          ) : null}
        </UiCard>
      </AdminContent>
    </AdminPage>
  )
}

export default NotificationsPage

