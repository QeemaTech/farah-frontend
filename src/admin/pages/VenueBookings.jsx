import { getVenueBookingsApiConfig, hasPermission, readAdminUser } from '../utils/adminSession'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Calendar, RefreshCw } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import { formatCurrency } from '../../utils/currency'

export default function VenueBookings() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const user = readAdminUser()
  const canRead = hasPermission(user, 'venue_bookings', 'read')

  const [bookings, setBookings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const limit = 20

  const load = useCallback(async () => {
    if (!canRead) return
    setLoading(true)
    try {
      const api = getVenueBookingsApiConfig()
      const { data } = await axios.get(api.listUrl, {
        headers: api.headers,
        params: {
          limit,
          offset: page * limit,
          ...api.listParams,
          ...(status && { status }),
        },
      })
      setBookings(data.bookings || [])
      setTotal(data.total || 0)
    } catch {
      toast.error(t('venueBookings.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [canRead, page, status, t])

  useEffect(() => {
    load()
  }, [load])

  if (!canRead) {
    return (
      <AdminPage title={t('venueBookings.title')}>
        <p className="text-sm text-amber-700">{t('venueBookings.noAccess')}</p>
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={t('venueBookings.title')}
      subtitle={t('venueBookings.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('venueBookings.title') },
      ]}
    >
      <div className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
        <p className="text-sm text-[var(--admin-text-muted)]">{t('venueBookings.subtitle')}</p>

        <div className="flex flex-wrap items-center gap-3">
          <select value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }} className="admin-input w-auto min-w-[160px]">
            <option value="">{t('venueBookings.allStatuses')}</option>
            {['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" className="admin-toolbar-btn" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            {t('slaughterOrders.refresh')}
          </button>
        </div>

        <div className="overflow-hidden rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-card)]">
          {loading ? (
            <div className="p-10 text-center text-[var(--admin-text-muted)]">{t('slaughterOrders.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ui-table min-w-full text-sm">
                <thead className="bg-[var(--admin-bg)] text-[var(--admin-text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('venueBookings.colNumber')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueBookings.colVenue')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueBookings.colCustomer')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueBookings.colDate')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueBookings.colAmount')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueBookings.colStatus')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueBookings.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-t border-[var(--admin-border)] text-[var(--admin-text)]">
                      <td className="px-4 py-3 font-mono text-xs">{b.bookingNumber}</td>
                      <td className="px-4 py-3">{rtl ? b.venue?.nameAr || b.venue?.name : b.venue?.name || b.venue?.nameAr}</td>
                      <td className="px-4 py-3">{b.customer?.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 opacity-60" />
                          {b.eventDate || (b.date && new Date(b.date).toLocaleDateString())}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatCurrency(b.finalAmount)}</td>
                      <td className="px-4 py-3 text-xs">{b.status}</td>
                      <td className="px-4 py-3">
                        <Link className="text-[var(--admin-accent)] hover:underline" to={`/admin/venue/bookings/${b.id}`}>
                          {t('venueBookings.open')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!bookings.length ? (
                <div className="border-t border-[var(--admin-border)] p-8 text-center text-[var(--admin-text-muted)]">
                  {t('venueBookings.empty')}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {total > limit ? (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              className="admin-toolbar-btn"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              {t('venueBookings.prev')}
            </button>
            <span className="self-center text-sm text-[var(--admin-text-muted)]">
              {page + 1} / {Math.ceil(total / limit) || 1}
            </span>
            <button
              type="button"
              className="admin-toolbar-btn"
              disabled={(page + 1) * limit >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('venueBookings.next')}
            </button>
          </div>
        ) : null}
      </div>
    </AdminPage>
  )
}
