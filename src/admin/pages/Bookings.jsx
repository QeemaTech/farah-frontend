import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FileBarChart, FileText, Eye, Calendar, Clock, CheckCircle } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_URL, getMarketplaceVendorApiConfig, usesProviderApis } from '../utils/adminSession'
import {
  AdminContent,
  Badge,
  SearchInput,
  EmptyState,
  UiCard,
  UiStat,
  UiStats,
  UiChipGroup,
  UiChip,
  UiTable,
  UiTableSkeleton,
} from '../design-system'

const STATUS_VARIANT = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const PAYMENT_VARIANT = {
  PENDING: 'warning',
  PAID: 'success',
  REFUNDED: 'info',
  FAILED: 'danger',
}

const TYPE_VARIANT = {
  VENUE_ONLY: 'info',
  SERVICES_ONLY: 'warning',
  MIXED: 'success',
}

const STATUS_CHIPS = [
  { value: '', key: 'allStatuses' },
  { value: 'PENDING', key: 'pending' },
  { value: 'CONFIRMED', key: 'confirmed' },
  { value: 'IN_PROGRESS', key: 'inProgress' },
  { value: 'COMPLETED', key: 'completed' },
  { value: 'CANCELLED', key: 'cancelled' },
]

function Bookings() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 10,
    totalPages: 0,
  })

  useEffect(() => {
    fetchBookings()
  }, [search, filterStatus, pagination.currentPage])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      const headers = { Authorization: `Bearer ${token}` }
      if (usesProviderApis()) {
        const vendorApi = getMarketplaceVendorApiConfig()
        const response = await axios.get(vendorApi.bookingsUrl, {
          headers: vendorApi.headers,
          params: {
            status: filterStatus || undefined,
            limit: pagination.limit,
            offset,
          },
        })
        let rows = response.data.bookings || []
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          rows = rows.filter(
            (b) =>
              (b.bookingNumber || '').toLowerCase().includes(q) ||
              (b.customer?.name || '').toLowerCase().includes(q) ||
              (b.customer?.phone || '').toLowerCase().includes(q),
          )
        }
        setBookings(rows)
        setPagination((prev) => ({
          ...prev,
          total: response.data.total ?? rows.length,
          totalPages: Math.ceil((response.data.total ?? rows.length) / prev.limit),
        }))
        return
      }
      const response = await axios.get(`${API_URL}/admin/bookings`, {
        headers,
        params: {
          search,
          status: filterStatus || undefined,
          limit: pagination.limit,
          offset,
        },
      })
      setBookings(response.data.bookings || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit),
      }))
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    if (usesProviderApis()) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/admin/bookings/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.error || t('updateFailed'))
    }
  }

  const updatePaymentStatus = async (id, paymentStatus) => {
    if (usesProviderApis()) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${API_URL}/admin/bookings/${id}/payment-status`,
        { paymentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.error || t('updateFailed'))
    }
  }

  const getBookingTypeLabel = (bookingType) => {
    const map = {
      VENUE_ONLY: language === 'ar' ? 'قاعة فقط' : 'Venue only',
      SERVICES_ONLY: language === 'ar' ? 'خدمات فقط' : 'Services only',
      MIXED: language === 'ar' ? 'قاعة + خدمات' : 'Venue + services',
    }
    return map[bookingType] || bookingType || '—'
  }

  const getLocationTypeText = (locationType) => {
    const locationMap = {
      venue: language === 'ar' ? 'قاعة' : 'Venue',
      home: language === 'ar' ? 'منزل' : 'Home',
      hotel: language === 'ar' ? 'فندق' : 'Hotel',
      outdoor: language === 'ar' ? 'خارجي' : 'Outdoor',
      other: language === 'ar' ? 'أخرى' : 'Other',
    }
    return locationMap[locationType] || locationType || '—'
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }

  const pendingCount = useMemo(() => bookings.filter((b) => b.status === 'PENDING').length, [bookings])
  const paidCount = useMemo(() => bookings.filter((b) => b.paymentStatus === 'PAID').length, [bookings])

  const headerActions = useMemo(
    () => (
      <button
        type="button"
        onClick={() => navigate('/admin/reports?generate=bookings')}
        className="ads-btn ads-btn-subtle gap-2"
      >
        <FileBarChart size={18} aria-hidden />
        {t('report')}
      </button>
    ),
    [navigate, t],
  )

  const toolbar = (
    <>
      <div className="ui-search ui-search--compact">
        <SearchInput
          placeholder={t('searchBookings', { ar: 'ابحث في الحجوزات...', en: 'Search bookings...' })}
          onDebouncedChange={(v) => {
            setSearch(v)
            setPagination((prev) => ({ ...prev, currentPage: 1 }))
          }}
        />
      </div>
      <UiChipGroup className="ui-card__toolbar-chips ui-card__toolbar-chips--end" ariaLabel={t('bookingStatus', { ar: 'حالة الحجز', en: 'Booking status' })}>
        {STATUS_CHIPS.map((c) => (
          <UiChip
            key={c.value || 'all'}
            active={filterStatus === c.value}
            onClick={() => {
              setFilterStatus(c.value)
              setPagination((prev) => ({ ...prev, currentPage: 1 }))
            }}
          >
            {t(c.key)}
          </UiChip>
        ))}
      </UiChipGroup>
    </>
  )

  return (
    <AdminPage
      title={t('bookings', { ar: 'الحجوزات', en: 'Bookings' })}
      subtitle={t('bookingsSubtitle', {
        ar: 'متابعة وإدارة حجوزات العملاء',
        en: 'Track and manage customer bookings',
      })}
      breadcrumbs={[
        { label: t('nav.dashboard', { ar: 'الرئيسية', en: 'Home' }), path: '/admin/dashboard' },
        { label: t('bookings') },
      ]}
      action={headerActions}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={Calendar} iconTone="indigo" value={pagination.total} label={t('totalBookings', { ar: 'إجمالي الحجوزات', en: 'Total bookings' })} />
          <UiStat icon={Clock} iconTone="amber" value={pendingCount} label={t('pending', { ar: 'قيد الانتظار', en: 'Pending' })} />
          <UiStat icon={CheckCircle} iconTone="emerald" value={paidCount} label={t('paid', { ar: 'مدفوعة', en: 'Paid' })} />
        </UiStats>

        <UiCard toolbar={toolbar} ariaLabel={t('bookings')} className="ui-card--flat ui-card--venues-toolbar ui-card--toolbar-inline">
          {loading ? (
            <UiTableSkeleton rows={8} cols={10} />
          ) : bookings.length === 0 ? (
            <EmptyState title={t('noData')} description={t('searchBookings')} />
          ) : (
            <>
              <UiTable tableClassName="ui-table--venues" minWidth={1200}>
                <thead>
                  <tr>
                    <th className="ui-table-col--booking-ref">{t('bookingNumber')}</th>
                    <th className="ui-table-col--status">{t('type', { ar: 'النوع', en: 'Type' })}</th>
                    <th className="ui-table-col--name">{t('customer')}</th>
                    <th className="ui-table-col--provider hidden md:table-cell">{t('venue')}</th>
                    <th className="hidden lg:table-cell">{t('services', { ar: 'الخدمات', en: 'Services' })}</th>
                    <th className="ui-table-col--rating">{t('date')}</th>
                    <th className="ui-table-col--price">{t('amount')}</th>
                    <th className="ui-table-col--status">{t('bookingStatus', { ar: 'الحجز', en: 'Status' })}</th>
                    <th className="ui-table-col--status hidden md:table-cell">{t('paymentStatus')}</th>
                    <th className="ui-table-col--actions text-end">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const customerName = language === 'ar'
                      ? booking.customer?.nameAr || booking.customer?.name
                      : booking.customer?.name || booking.customer?.nameAr
                    const venueName = language === 'ar'
                      ? booking.venue?.nameAr || booking.venue?.name
                      : booking.venue?.name || booking.venue?.nameAr
                    const amountValue = (Number(booking.finalAmount) || 0).toFixed(2)
                    const bookingRef = booking.bookingNumber || booking.id.slice(0, 8)

                    return (
                    <tr
                      key={booking.id}
                      className="ui-table-row--clickable"
                      onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                    >
                      <td className="ui-table-cell--nowrap">
                        <span className="ui-table-booking-ref" title={bookingRef}>{bookingRef}</span>
                      </td>
                      <td className="ui-table-cell--nowrap">
                        {booking.bookingType ? (
                          <Badge variant={TYPE_VARIANT[booking.bookingType] || 'default'} className="ui-badge--nowrap">
                            {getBookingTypeLabel(booking.bookingType)}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="ui-table-cell-stack">
                          <span className="ui-table-cell-stack__primary" title={customerName || '—'}>{customerName || '—'}</span>
                          {booking.customer?.phone ? (
                            <span className="ui-table-cell-stack__secondary ui-user-meta">{booking.customer.phone}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="ui-table-provider" title={venueName || '—'}>{venueName || '—'}</span>
                      </td>
                      <td className="hidden lg:table-cell">
                        {booking.services?.length > 0 ? (
                          <span className="ui-table-provider" title={booking.services.map((bs) => bs.service?.nameAr || bs.service?.name).filter(Boolean).join(' · ')}>
                            {booking.services.slice(0, 2).map((bs) => bs.service?.nameAr || bs.service?.name).filter(Boolean).join(' · ')}
                            {booking.services.length > 2 ? ` +${booking.services.length - 2}` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="ui-table-cell--nowrap">
                        {booking.date
                          ? new Date(booking.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
                          : '—'}
                      </td>
                      <td>
                        <div className="ui-table-cell-stack ui-table-cell-stack--price">
                          <span className="ui-table-cell-stack__primary tabular-nums">{amountValue}</span>
                          <span className="ui-table-cell-stack__secondary">{t('currency')}</span>
                        </div>
                      </td>
                      <td className="ui-table-cell--nowrap">
                        <Badge variant={STATUS_VARIANT[booking.status] || 'default'} className="ui-badge--nowrap">
                          {t(booking.status?.toLowerCase() || 'pending')}
                        </Badge>
                      </td>
                      <td className="ui-table-cell--nowrap hidden md:table-cell">
                        <Badge variant={PAYMENT_VARIANT[booking.paymentStatus] || 'default'} className="ui-badge--nowrap">
                          {t(booking.paymentStatus?.toLowerCase() || 'pending')}
                        </Badge>
                      </td>
                      <td className="ui-table-cell--nowrap">
                        <div className="ui-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/bookings/${booking.id}/invoice`)}
                            className="ui-action-btn"
                            title={t('viewInvoice')}
                          >
                            <FileText size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                            className="ui-action-btn"
                            title={t('view')}
                          >
                            <Eye size={16} aria-hidden />
                          </button>
                          {!usesProviderApis() ? (
                            <select
                              value={booking.status}
                              onChange={(e) => updateStatus(booking.id, e.target.value)}
                              className="admin-input"
                              style={{ width: 120, height: 34, fontSize: 12, padding: '0 8px' }}
                              dir={language}
                              aria-label={t('status')}
                            >
                              <option value="PENDING">{t('pending')}</option>
                              <option value="CONFIRMED">{t('confirmed')}</option>
                              <option value="IN_PROGRESS">{t('inProgress')}</option>
                              <option value="COMPLETED">{t('completed')}</option>
                              <option value="CANCELLED">{t('cancelled')}</option>
                            </select>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </UiTable>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                total={pagination.total}
                limit={pagination.limit}
              />
            </>
          )}
        </UiCard>
      </AdminContent>

      <Modal
        isOpen={showDetails && !!selectedBooking}
        onClose={() => {
          setShowDetails(false)
          setSelectedBooking(null)
        }}
        title={language === 'ar' ? 'تفاصيل الحجز' : 'Booking details'}
        size="lg"
      >
        {selectedBooking ? (
          <div className="admin-form-grid">
            <div>
              <label className="mb-1 block text-sm font-semibold">{t('bookingNumber')}</label>
              <p>{selectedBooking.bookingNumber}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">{t('date')}</label>
              <p>
                {selectedBooking.date
                  ? new Date(selectedBooking.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
                  : '—'}
              </p>
            </div>
            {!usesProviderApis() ? (
              <div className="span-2 flex flex-wrap gap-3">
                <select
                  className="admin-input flex-1"
                  value={selectedBooking.status}
                  onChange={(e) => {
                    updateStatus(selectedBooking.id, e.target.value)
                    setSelectedBooking({ ...selectedBooking, status: e.target.value })
                  }}
                >
                  <option value="PENDING">{t('pending')}</option>
                  <option value="CONFIRMED">{t('confirmed')}</option>
                  <option value="IN_PROGRESS">{t('inProgress')}</option>
                  <option value="COMPLETED">{t('completed')}</option>
                  <option value="CANCELLED">{t('cancelled')}</option>
                </select>
                <select
                  className="admin-input flex-1"
                  value={selectedBooking.paymentStatus}
                  onChange={(e) => {
                    updatePaymentStatus(selectedBooking.id, e.target.value)
                    setSelectedBooking({ ...selectedBooking, paymentStatus: e.target.value })
                  }}
                >
                  <option value="PENDING">{t('pending')}</option>
                  <option value="PAID">{t('paid')}</option>
                  <option value="REFUNDED">{t('refunded')}</option>
                  <option value="FAILED">{t('failed')}</option>
                </select>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </AdminPage>
  )
}

export default Bookings
