import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ShoppingBag, Clock, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import { AdminContent, Badge, SearchInput, UiCard, UiStats, UiStat, UiTable, UiTableSkeleton } from '../design-system'
import { getSlaughterApiMode } from '../utils/adminSession'

const STATUS_VARIANT = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'default',
  DELIVERED: 'success',
  CANCELLED: 'danger',
}

export default function SlaughterOrders() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'

  const STATUS_KEYS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED']

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [deliveryType, setDeliveryType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { origin, headers: hdr, useVendorProductApi } = getSlaughterApiMode()
      const params = {
        limit,
        offset: page * limit,
        ...(status && { status }),
        ...(search.trim() && { q: search.trim() }),
        ...(deliveryType && { deliveryType }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(minTotal !== '' && minTotal != null && { minTotal }),
        ...(maxTotal !== '' && maxTotal != null && { maxTotal }),
      }
      if (useVendorProductApi) {
        const { data } = await axios.get(`${origin}/api/mobile/vendor/slaughter/orders`, { headers: hdr, params })
        setOrders(data.orders || [])
        setTotal(data.total ?? data.orders?.length ?? 0)
      } else {
        const { data } = await axios.get(`${origin}/api/admin/slaughter/orders`, { headers: hdr, params })
        setOrders(data.orders || [])
        setTotal(data.total || 0)
      }
    } catch {
      toast.error(t('slaughterOrders.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [status, page, deliveryType, dateFrom, dateTo, minTotal, maxTotal, search, t])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (id, newStatus) => {
    try {
      const { origin, headers: hdr, useVendorProductApi } = getSlaughterApiMode()
      const url = useVendorProductApi
        ? `${origin}/api/mobile/vendor/slaughter/orders/${id}/status`
        : `${origin}/api/admin/slaughter/orders/${id}/status`
      await axios.patch(url, { status: newStatus }, { headers: hdr })
      toast.success(t('slaughterOrders.statusUpdated'))
      load()
    } catch {
      toast.error(t('slaughterOrders.statusFailed'))
    }
  }

  const filteredOrders = orders

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setDeliveryType('')
    setDateFrom('')
    setDateTo('')
    setMinTotal('')
    setMaxTotal('')
    setPage(0)
  }

  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length

  const labelForStatus = (k) => {
    const map = {
      PENDING: 'stPending',
      CONFIRMED: 'stConfirmed',
      PROCESSING: 'stProcessing',
      DELIVERED: 'stDelivered',
      CANCELLED: 'stCancelled',
    }
    return t(`slaughterOrders.${map[k] || 'stPending'}`)
  }

  const toolbar = (
    <>
      <div className="ui-search">
        <SearchInput
          placeholder={t('slaughterOrders.searchPh')}
          onDebouncedChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
      </div>
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value)
          setPage(0)
        }}
        className="admin-input h-11 min-w-[140px]"
        aria-label={t('slaughterOrders.colStatus')}
      >
        <option value="">{t('slaughterOrders.allStatuses')}</option>
        {STATUS_KEYS.map((k) => (
          <option key={k} value={k}>
            {labelForStatus(k)}
          </option>
        ))}
      </select>
      <select
        value={deliveryType}
        onChange={(e) => {
          setDeliveryType(e.target.value)
          setPage(0)
        }}
        className="admin-input h-11 min-w-[140px]"
      >
        <option value="">{t('slaughterOrders.allDelivery')}</option>
        <option value="venue">{t('slaughterOrders.deliveryVenue')}</option>
        <option value="home">{t('slaughterOrders.deliveryHome')}</option>
      </select>
      <button type="button" onClick={load} className="ads-btn ads-btn-subtle gap-2">
        <RefreshCw className="h-4 w-4" aria-hidden />
        {t('slaughterOrders.refresh')}
      </button>
      <button type="button" onClick={resetFilters} className="ads-btn ads-btn-subtle gap-2">
        <Clock className="h-4 w-4" aria-hidden />
        {t('slaughterOrders.reset')}
      </button>
    </>
  )

  const filterExtras = (
    <div className="grid gap-3 border-t border-[var(--admin-border)] px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => {
          setDateFrom(e.target.value)
          setPage(0)
        }}
        className="admin-input"
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => {
          setDateTo(e.target.value)
          setPage(0)
        }}
        className="admin-input"
      />
      <input
        type="number"
        value={minTotal}
        onChange={(e) => {
          setMinTotal(e.target.value)
          setPage(0)
        }}
        placeholder={t('slaughterOrders.minTotal')}
        className="admin-input"
      />
      <input
        type="number"
        value={maxTotal}
        onChange={(e) => {
          setMaxTotal(e.target.value)
          setPage(0)
        }}
        placeholder={t('slaughterOrders.maxTotal')}
        className="admin-input"
      />
    </div>
  )

  return (
    <AdminPage
      title={t('slaughterOrders.title')}
      subtitle={t('slaughterOrders.subtitle', { defaultValue: rtl ? 'متابعة طلبات الذبائح' : 'Manage slaughter orders' })}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughterOrders.title') },
      ]}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={ShoppingBag} iconTone="indigo" value={total} label={t('slaughterOrders.statTotal')} />
          <UiStat icon={Clock} iconTone="amber" value={pendingCount} label={t('slaughterOrders.statPending')} />
          <UiStat icon={CheckCircle} iconTone="emerald" value={deliveredCount} label={t('slaughterOrders.statDelivered')} />
        </UiStats>

        <UiCard toolbar={toolbar} ariaLabel={t('slaughterOrders.panelTitle')}>
          {filterExtras}
          {loading ? (
            <UiTableSkeleton rows={8} cols={9} />
          ) : !filteredOrders.length ? (
            <div className="py-16 text-center text-[var(--admin-text-muted)]">{t('slaughterOrders.empty')}</div>
          ) : (
            <>
              <UiTable minWidth={1100}>
                <thead>
                  <tr>
                    <th>{t('slaughterOrders.colOrder')}</th>
                    <th>{t('slaughterOrders.colCustomer')}</th>
                    <th>{t('slaughterOrders.colGuests')}</th>
                    <th>{t('slaughterOrders.colTotal')}</th>
                    <th>{t('slaughterOrders.colItems')}</th>
                    <th>{t('slaughterOrders.colBooking')}</th>
                    <th>{t('slaughterOrders.colStatus')}</th>
                    <th>{t('slaughterOrders.colChangeStatus')}</th>
                    <th className="text-end">{t('slaughterOrders.colDetail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-[var(--admin-bg)]/60">
                      <td>
                        <code className="text-xs font-semibold text-[var(--admin-accent)]">{o.orderNumber}</code>
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--admin-text)]">{o.customer?.name}</div>
                        <div className="text-xs text-[var(--admin-text-muted)]">{o.customer?.phone}</div>
                      </td>
                      <td>{o.guestCount}</td>
                      <td>
                        <span className="font-semibold text-[var(--admin-text)]">
                          {Number(o.totalAmount || 0).toFixed(2)} {t('slaughter.currencyShort')}
                        </span>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {(o.items || []).map((i) => (
                            <div key={i.id} className="text-xs text-[var(--admin-text-muted)]">
                              {i.product?.nameAr} × {i.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        {o.booking?.bookingNumber ? (
                          <span className="text-xs font-medium text-[var(--admin-accent)]">{o.booking.bookingNumber}</span>
                        ) : (
                          <span className="text-xs text-[var(--admin-text-muted)]">{t('slaughterOrders.notLinked')}</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={STATUS_VARIANT[o.status] || 'default'}>{labelForStatus(o.status)}</Badge>
                      </td>
                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="admin-input h-9 max-w-[160px] py-0 text-xs"
                        >
                          {STATUS_KEYS.map((k) => (
                            <option key={k} value={k}>
                              {labelForStatus(k)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Link
                          to={`/admin/slaughter/orders/${o.id}`}
                          className="ads-btn ads-btn-subtle inline-flex h-9 gap-1.5 px-3 text-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          {t('slaughterOrders.openDetail')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </UiTable>
              <Pagination
                currentPage={page + 1}
                totalPages={Math.ceil(total / limit) || 1}
                onPageChange={(p) => setPage(p - 1)}
                total={total}
                limit={limit}
              />
            </>
          )}
        </UiCard>
      </AdminContent>
    </AdminPage>
  )
}
