import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import AdminDetailShell from '../components/AdminDetailShell'
import { AdminContent, Badge, UiCard, UiStat, UiStats, UiTable } from '../design-system'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { formatImageSrc } from '../../utils/imageUtils'
import { API_URL, getMarketplaceVendorApiConfig, usesProviderApis } from '../utils/adminSession'
import VatTotals from '../../components/VatTotals'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  DollarSign,
  Printer,
  Building2,
  CreditCard,
  FileText,
} from 'lucide-react'

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
  PARTIAL: 'info',
  REFUNDED: 'default',
  FAILED: 'danger',
}

function parseImages(images) {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const p = typeof images === 'string' ? JSON.parse(images) : images
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

export default function BookingDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const rtl = language === 'ar'
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const bookingsPath = usesProviderApis() ? '/admin/dashboard' : '/admin/bookings'

  useEffect(() => {
    fetchBookingDetails()
  }, [id])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const vendorApi = getMarketplaceVendorApiConfig()
      const base = usesProviderApis() ? vendorApi.bookingsUrl : `${API_URL}/admin/bookings`
      const response = await axios.get(`${base}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBooking(response.data.booking)
    } catch (error) {
      toast.error(error.response?.data?.error || t('bookingDetail.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    if (usesProviderApis()) {
      toast.error(t('bookingDetail.adminOnly'))
      return
    }
    try {
      setUpdating(true)
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${API_URL}/admin/bookings/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(t('bookingDetail.statusUpdated'))
      fetchBookingDetails()
    } catch (error) {
      toast.error(error.response?.data?.error || t('updateFailed'))
    } finally {
      setUpdating(false)
    }
  }

  const updatePaymentStatus = async (newPaymentStatus) => {
    if (usesProviderApis()) {
      toast.error(t('bookingDetail.adminOnly'))
      return
    }
    try {
      setUpdating(true)
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${API_URL}/admin/bookings/${id}/payment-status`,
        { paymentStatus: newPaymentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(t('bookingDetail.paymentUpdated'))
      fetchBookingDetails()
    } catch (error) {
      toast.error(error.response?.data?.error || t('updateFailed'))
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString(rtl ? 'ar-SA' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const statusOptions = useMemo(
    () => [
      { value: 'PENDING', label: t('bookingDetail.statusPending') },
      { value: 'CONFIRMED', label: t('bookingDetail.statusConfirmed') },
      { value: 'IN_PROGRESS', label: t('bookingDetail.statusInProgress') },
      { value: 'COMPLETED', label: t('bookingDetail.statusCompleted') },
      { value: 'CANCELLED', label: t('bookingDetail.statusCancelled') },
    ],
    [t],
  )

  const paymentOptions = useMemo(
    () => [
      { value: 'PENDING', label: t('bookingDetail.payPending') },
      { value: 'PAID', label: t('bookingDetail.payPaid') },
      { value: 'PARTIAL', label: t('bookingDetail.payPartial') },
      { value: 'REFUNDED', label: t('bookingDetail.payRefunded') },
      { value: 'FAILED', label: t('bookingDetail.payFailed') },
    ],
    [t],
  )

  const finalAmount = booking?.finalAmount ?? (booking?.totalAmount || 0) - (booking?.discount || 0)
  const ref = booking?.bookingNumber || booking?.id?.slice(0, 8)

  return (
    <AdminDetailShell
      title={t('bookingDetail.title')}
      subtitle={ref ? `#${ref}` : ''}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.bookings'), path: bookingsPath },
        { label: t('bookingDetail.title') },
      ]}
      backTo={bookingsPath}
      backLabel={t('nav.bookings')}
      loading={loading}
      empty={!loading && !booking}
      emptyTitle={t('bookingDetail.notFound')}
      action={
        booking ? (
          <button
            type="button"
            onClick={() => navigate(`/admin/bookings/${id}/invoice`)}
            className="ads-btn ads-btn-primary gap-2"
          >
            <Printer className="h-4 w-4" aria-hidden />
            {t('bookingDetail.printInvoice')}
          </button>
        ) : null
      }
      noCard
    >
      {booking ? (
        <AdminContent className="gap-6">
          <div className="admin-booking-hero">
            <div className="admin-booking-hero__main">
              <p className="admin-booking-hero__ref">{t('bookingDetail.bookingRef')}: {ref}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[booking.status] || 'neutral'}>{booking.status}</Badge>
                <Badge variant={PAYMENT_VARIANT[booking.paymentStatus] || 'warning'}>
                  {booking.paymentStatus || 'PENDING'}
                </Badge>
                {booking.bookingType ? (
                  <Badge variant="default">{booking.bookingType}</Badge>
                ) : null}
              </div>
              <div className="admin-booking-hero__datetime">
                <Calendar className="h-4 w-4" aria-hidden />
                <span>{formatDate(booking.eventDate || booking.date)}</span>
                {(booking.startTime || booking.endTime) && (
                  <>
                    <Clock className="h-4 w-4 ms-2" aria-hidden />
                    <span>
                      {booking.startTime || '—'} – {booking.endTime || '—'}
                    </span>
                  </>
                )}
              </div>
            </div>
            <UiStats className="admin-booking-hero__stats">
              <UiStat
                icon={DollarSign}
                iconTone="emerald"
                value={`${finalAmount.toFixed(2)} ${t('currency')}`}
                label={t('bookingDetail.total')}
              />
              <UiStat
                icon={CreditCard}
                iconTone="amber"
                value={`${(booking.depositAmount ?? 0).toFixed(2)} ${t('currency')}`}
                label={t('bookingDetail.deposit')}
              />
              <UiStat
                icon={FileText}
                iconTone="indigo"
                value={(booking.services?.length || 0) + (booking.venue ? 1 : 0)}
                label={t('bookingDetail.items')}
              />
            </UiStats>
          </div>

          {!usesProviderApis() ? (
            <div className="admin-booking-controls">
              <UiCard>
                <h3 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">{t('bookingDetail.updateStatus')}</h3>
                <select
                  value={booking.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={updating}
                  className="admin-input w-full max-w-xs"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </UiCard>
              <UiCard>
                <h3 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">{t('bookingDetail.updatePayment')}</h3>
                <select
                  value={booking.paymentStatus || 'PENDING'}
                  onChange={(e) => updatePaymentStatus(e.target.value)}
                  disabled={updating}
                  className="admin-input w-full max-w-xs"
                >
                  {paymentOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </UiCard>
            </div>
          ) : null}

          <div className="admin-detail-panels-2">
            {booking.customer ? (
              <UiCard>
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--admin-text)]">
                  <User className="h-5 w-5 text-[var(--admin-accent)]" aria-hidden />
                  {t('bookingDetail.customer')}
                </h3>
                <ul className="admin-customer-card__list">
                  <li className="admin-customer-card__item">
                    <span className="admin-customer-card__label">{t('name')}</span>
                    <span className="admin-customer-card__value">
                      {language === 'ar'
                        ? booking.customer.nameAr || booking.customer.name
                        : booking.customer.name || booking.customer.nameAr}
                    </span>
                  </li>
                  {booking.customer.phone ? (
                    <li className="admin-customer-card__item">
                      <span className="admin-customer-card__label">{t('phone')}</span>
                      <span className="admin-customer-card__value" dir="ltr">
                        {booking.customer.phone}
                      </span>
                    </li>
                  ) : null}
                  {booking.customer.email ? (
                    <li className="admin-customer-card__item">
                      <span className="admin-customer-card__label">{t('email')}</span>
                      <span className="admin-customer-card__value" dir="ltr">
                        {booking.customer.email}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </UiCard>
            ) : null}

            {booking.venue ? (
              <UiCard>
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--admin-text)]">
                  <Building2 className="h-5 w-5 text-[var(--admin-accent)]" aria-hidden />
                  {t('venue')}
                </h3>
                <p className="font-semibold text-[var(--admin-text)]">
                  {language === 'ar' ? booking.venue.nameAr || booking.venue.name : booking.venue.name || booking.venue.nameAr}
                </p>
                {booking.venue.address ? (
                  <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{booking.venue.address}</p>
                ) : null}
                <p className="mt-3 text-lg font-bold text-[var(--admin-accent)]">
                  {(booking.venue.price ?? 0).toFixed(2)} {t('currency')}
                </p>
              </UiCard>
            ) : null}
          </div>

          {booking.services?.length > 0 ? (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('bookingDetail.services')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {booking.services.map((bs) => {
                  const service = bs.service
                  if (!service) return null
                  const imgs = parseImages(service.images)
                  return (
                    <div key={bs.id} className="admin-booking-service-card">
                      {imgs[0] ? (
                        <img src={formatImageSrc(imgs[0])} alt="" className="admin-booking-service-card__img" />
                      ) : null}
                      <div className="admin-booking-service-card__body">
                        <p className="font-semibold text-[var(--admin-text)]">
                          {language === 'ar' ? service.nameAr || service.name : service.name || service.nameAr}
                        </p>
                        {service.category ? (
                          <Badge variant="info">
                            {language === 'ar'
                              ? service.category.nameAr || service.category.name
                              : service.category.name || service.category.nameAr}
                          </Badge>
                        ) : null}
                        <p className="mt-2 font-bold text-[var(--admin-accent)]">
                          {(bs.price ?? service.price ?? 0).toFixed(2)} {t('currency')}
                        </p>
                        <Link to={`/admin/services/${service.id}`} className="mt-2 inline-block text-sm text-[var(--admin-text-link)]">
                          {t('bookingDetail.viewService')}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </UiCard>
          ) : null}

          <UiCard>
            <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('bookingDetail.paymentSummary')}</h3>
            <div className="admin-payment-lines">
              <div className="admin-payment-line">
                <span>{t('bookingDetail.subtotal')}</span>
                <span>{(booking.totalAmount ?? 0).toFixed(2)} {t('currency')}</span>
              </div>
              {(booking.discount ?? 0) > 0 ? (
                <div className="admin-payment-line admin-payment-line--discount">
                  <span>{t('discount')}</span>
                  <span>-{(booking.discount ?? 0).toFixed(2)} {t('currency')}</span>
                </div>
              ) : null}
              <div className="admin-payment-line admin-payment-line--total">
                <span>{t('bookingDetail.total')}</span>
                <span>
                  {finalAmount.toFixed(2)} {t('currency')}
                </span>
              </div>
              <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
                <VatTotals record={booking} subtotal={finalAmount} />
              </div>
              {booking.depositAmount != null ? (
                <div className="admin-payment-line">
                  <span>{t('bookingDetail.deposit')}</span>
                  <span>
                    {booking.depositAmount.toFixed(2)} {t('currency')}
                    {booking.depositPaid ? ` (${t('bookingDetail.paid')})` : ''}
                  </span>
                </div>
              ) : null}
            </div>
          </UiCard>

          {booking.payments?.length > 0 ? (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('bookingDetail.paymentLog')}</h3>
              <UiTable minWidth={560}>
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('bookingDetail.method')}</th>
                    <th>{t('price')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.payments.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDate(p.createdAt)}</td>
                      <td>{p.method || '—'}</td>
                      <td className="font-semibold">
                        {(p.amount ?? 0).toFixed(2)} {t('currency')}
                      </td>
                      <td>
                        <Badge variant={PAYMENT_VARIANT[p.status] || 'neutral'}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </UiTable>
            </UiCard>
          ) : null}

          {booking.notes ? (
            <UiCard>
              <h3 className="mb-2 text-base font-bold text-[var(--admin-text)]">{t('bookingDetail.notes')}</h3>
              <p className="whitespace-pre-wrap text-sm text-[var(--admin-text-muted)]">{booking.notes}</p>
            </UiCard>
          ) : null}
        </AdminContent>
      ) : null}
    </AdminDetailShell>
  )
}
