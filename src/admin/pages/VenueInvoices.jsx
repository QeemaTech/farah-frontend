import { API_URL, adminAuthHeaders, getMobileVendorApiBase, getVenueVendorApiMode, hasPermission, isFullAdminUser, readAdminUser } from '../utils/adminSession'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Filter, RefreshCw, Search } from 'lucide-react'
import AdminPage from '../components/AdminPage'
export default function VenueInvoices() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const user = readAdminUser()
  const isAdmin = isFullAdminUser(user)
  const canRead = isAdmin || hasPermission(user, 'venue_invoices', 'read')

  const [invoices, setInvoices] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  const [q, setQ] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [bookingNumber, setBookingNumber] = useState('')
  const [bookingStatus, setBookingStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    if (!canRead) return
    setLoading(true)
    try {
      const params = {
        limit,
        offset: page * limit,
        ...(q.trim() && { q: q.trim() }),
        ...(invoiceNumber.trim() && { invoiceNumber: invoiceNumber.trim() }),
        ...(bookingNumber.trim() && { bookingNumber: bookingNumber.trim() }),
        ...(bookingStatus && { bookingStatus }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }
      let url
      let headers
      if (isAdmin) {
        url = `${API_URL}/admin/venue-booking-invoices`
        headers = adminAuthHeaders()
      } else {
        const mode = getVenueVendorApiMode()
        url = `${getMobileVendorApiBase()}/invoices`
        headers = mode.headers
      }
      const { data } = await axios.get(url, { headers, params })
      setInvoices(data.invoices || [])
      setTotal(data.total || 0)
    } catch {
      toast.error(t('venueInvoices.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [bookingNumber, bookingStatus, canRead, dateFrom, dateTo, invoiceNumber, isAdmin, page, q, t])

  useEffect(() => {
    load()
  }, [load])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ invoices, exportedAt: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `venue-booking-invoices-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!canRead) {
    return (
      <AdminPage
      title={t('venueInvoices.title')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('venueInvoices.title') },
      ]}
    >
        <p className="text-sm text-amber-700">{t('venueBookings.noAccess')}</p>
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={t('venueInvoices.title')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('venueInvoices.title') },
      ]}
    >
      <div className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
        <p className="text-sm text-[var(--admin-text-muted)]">{t('venueInvoices.subtitle')}</p>

        <div className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-shadow-card)]">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-5 w-5 text-[var(--admin-accent)]" />
            <h2 className="font-semibold text-[var(--admin-text)]">{t('venueInvoices.filters')}</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)] ${rtl ? 'right-3' : 'left-3'}`} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('venueInvoices.phSearch')}
                className={`admin-input ${rtl ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder={t('venueInvoices.phInvoiceNo')}
              className="admin-input"
            />
            <input
              value={bookingNumber}
              onChange={(e) => setBookingNumber(e.target.value)}
              placeholder={t('venueInvoices.phBookingNo')}
              className="admin-input"
            />
            <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className="admin-input">
              <option value="">{t('venueBookings.allStatuses')}</option>
              {['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="admin-input" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="admin-input" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="admin-toolbar-btn" onClick={() => { setPage(0); load() }}>
              {t('venueInvoices.apply')}
            </button>
            <button type="button" className="admin-toolbar-btn" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              {t('slaughterOrders.refresh')}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" className="admin-toolbar-btn" onClick={exportJson}>
            {t('venueInvoices.export')}
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
                    <th className="px-4 py-3 font-semibold">{t('venueInvoices.colInvoice')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueInvoices.colBooking')}</th>
                    {isAdmin ? <th className="px-4 py-3 font-semibold">{t('venueInvoices.colVendor')}</th> : null}
                    <th className="px-4 py-3 font-semibold">{t('venueInvoices.colAmount')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueInvoices.colDate')}</th>
                    <th className="px-4 py-3 font-semibold">{t('venueInvoices.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-[var(--admin-border)] text-[var(--admin-text)]">
                      <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">{inv.booking?.bookingNumber}</td>
                      {isAdmin ? (
                        <td className="px-4 py-3 text-xs">{inv.employer?.name || inv.employer?.email}</td>
                      ) : null}
                      <td className="px-4 py-3">{inv.booking?.finalAmount}</td>
                      <td className="px-4 py-3 text-xs">{inv.createdAt && new Date(inv.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {!isAdmin && inv.booking?.id ? (
                          <Link className="text-[var(--admin-accent)] hover:underline" to={`/admin/venue/bookings/${inv.booking.id}`}>
                            {t('venueInvoices.openBooking')}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="text-[var(--admin-accent)] hover:underline"
                            onClick={() => {
                              const blob = new Blob([JSON.stringify(inv.snapshot, null, 2)], { type: 'application/json' })
                              const a = document.createElement('a')
                              a.href = URL.createObjectURL(blob)
                              a.download = `${inv.invoiceNumber}.json`
                              a.click()
                              URL.revokeObjectURL(a.href)
                            }}
                          >
                            {t('venueInvoices.download')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!invoices.length ? (
                <div className="border-t border-[var(--admin-border)] p-8 text-center text-[var(--admin-text-muted)]">{t('venueInvoices.empty')}</div>
              ) : null}
            </div>
          )}
        </div>

        {total > limit ? (
          <div className="flex justify-center gap-2">
            <button type="button" className="admin-toolbar-btn" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
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
