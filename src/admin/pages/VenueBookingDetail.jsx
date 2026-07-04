import { getVenueBookingsApiConfig, hasPermission, readAdminUser } from '../utils/adminSession'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { ArrowLeft, FileText } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import { formatCurrency } from '../../utils/currency'

const STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'ACTIVE', 'COMPLETED', 'CANCELLED']

export default function VenueBookingDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const user = readAdminUser()
  const canRead = hasPermission(user, 'venue_bookings', 'read')
  const canUpdateStatus = hasPermission(user, 'venue_bookings', 'update')
  const canInvoice = hasPermission(user, 'venue_invoices', 'create')

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusDraft, setStatusDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!canRead || !id) return
    setLoading(true)
    try {
      const api = getVenueBookingsApiConfig()
      const { data } = await axios.get(api.detailUrl(id), { headers: api.headers })
      const b = data.booking
      setBooking(b)
      setStatusDraft(b?.status || '')
    } catch {
      toast.error(t('venueBookings.loadFailed'))
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }, [canRead, id, t])

  useEffect(() => {
    load()
  }, [load])

  const saveStatus = async () => {
    if (!canUpdateStatus || !id || !statusDraft) return
    setSaving(true)
    try {
      const api = getVenueBookingsApiConfig()
      const { data } = await axios.patch(
        api.statusUrl(id),
        { status: statusDraft },
        { headers: api.statusHeaders || api.headers },
      )
      setBooking(data.booking)
      toast.success(t('venueBookingDetail.statusSaved'))
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    } finally {
      setSaving(false)
    }
  }

  const venueBookingApi = getVenueBookingsApiConfig()

  const createInvoice = async () => {
    if (!canInvoice || !id || !venueBookingApi.invoiceUrl) return
    try {
      await axios.post(
        venueBookingApi.invoiceUrl,
        { bookingId: id },
        { headers: venueBookingApi.invoiceHeaders || venueBookingApi.headers },
      )
      toast.success(t('venueBookingDetail.invoiceCreated'))
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    }
  }

  if (!canRead) {
    return (
      <AdminPage
      title={t('venueBookingDetail.title')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('venueBookings.title'), path: '/admin/venue/bookings' },
        { label: t('venueBookingDetail.title') },
      ]}
    >
        <p className="text-sm text-amber-700">{t('venueBookings.noAccess')}</p>
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={t('venueBookingDetail.title')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('venueBookings.title'), path: '/admin/venue/bookings' },
        { label: t('venueBookingDetail.title') },
      ]}
    >
      <div className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
        <Link to="/admin/venue/bookings" className="inline-flex items-center gap-2 text-sm text-[var(--admin-accent)] hover:underline">
          <ArrowLeft className={`h-4 w-4 ${rtl ? 'rotate-180' : ''}`} />
          {t('venueBookingDetail.back')}
        </Link>

        {loading ? (
          <div className="p-10 text-center text-[var(--admin-text-muted)]">{t('slaughterOrders.loading')}</div>
        ) : !booking ? (
          <p className="text-sm text-rose-600">{t('venueBookingDetail.notFound')}</p>
        ) : (
          <div className="space-y-4 rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">{booking.bookingNumber}</h2>
                <p className="text-sm text-[var(--admin-text-muted)]">
                  {rtl ? booking.venue?.nameAr || booking.venue?.name : booking.venue?.name || booking.venue?.nameAr}
                </p>
              </div>
              <div className="text-right rtl:text-left">
                <div className="text-sm text-[var(--admin-text-muted)]">{t('venueBookingDetail.amount')}</div>
                <div className="text-lg font-semibold">{formatCurrency(booking.finalAmount)}</div>
              </div>
            </div>

            <dl className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <dt className="text-[var(--admin-text-muted)]">{t('venueBookingDetail.customer')}</dt>
                <dd className="font-medium">{booking.customer?.name}</dd>
                <dd className="text-xs text-[var(--admin-text-muted)]">{booking.customer?.phone}</dd>
              </div>
              <div>
                <dt className="text-[var(--admin-text-muted)]">{t('venueBookingDetail.date')}</dt>
                <dd>{booking.eventDate || (booking.date && new Date(booking.date).toLocaleString())}</dd>
              </div>
              <div>
                <dt className="text-[var(--admin-text-muted)]">{t('venueBookingDetail.payment')}</dt>
                <dd>
                  {booking.paymentStatus} / {booking.paymentMethod || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--admin-text-muted)]">{t('venueBookingDetail.notes')}</dt>
                <dd className="whitespace-pre-wrap">{booking.notes || '—'}</dd>
              </div>
            </dl>

            {canUpdateStatus ? (
              <div className="flex flex-wrap items-end gap-3 border-t border-[var(--admin-border)] pt-4">
                <div>
                  <label className="mb-1 block text-xs text-[var(--admin-text-muted)]">{t('venueBookingDetail.status')}</label>
                  <select className="admin-input" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" className="rounded-[10px] bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-white" disabled={saving} onClick={saveStatus}>
                  {t('venueBookingDetail.saveStatus')}
                </button>
              </div>
            ) : null}

            {canInvoice && venueBookingApi.invoiceUrl ? (
              <div className="border-t border-[var(--admin-border)] pt-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-4 py-2 text-sm font-medium text-[var(--admin-text)]"
                  onClick={createInvoice}
                >
                  <FileText className="h-4 w-4" />
                  {t('venueBookingDetail.saveInvoice')}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminPage>
  )
}
