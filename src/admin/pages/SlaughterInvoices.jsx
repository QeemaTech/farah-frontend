import { API_URL, getSlaughterApiMode, hasPermission, isFullAdminUser, readAdminUser } from '../utils/adminSession'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Archive, Eye, FileText, LayoutGrid, List, RefreshCw } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import { AdminContent, Badge, SearchInput, UiCard, UiStat, UiStats, UiTable, UiTableSkeleton } from '../design-system'
import { formatCurrency } from '../../utils/currency'

const STATUS_VARIANT = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'default',
  DELIVERED: 'success',
  CANCELLED: 'danger',
}

export default function SlaughterInvoices() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const user = readAdminUser()
  const isAdmin = isFullAdminUser(user)
  const canCreate = hasPermission(user, 'slaughter_invoices', 'create')

  const [settings, setSettings] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [viewMode, setViewMode] = useState('cards')
  const limit = 20

  const [q, setQ] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const cur = {
    currencySymbol: settings?.currencySymbol || settings?.currencyCode || 'ر.س',
    currencyCode: settings?.currencyCode || 'SAR',
    currencyDecimals: settings?.currencyDecimals != null ? settings.currencyDecimals : 2,
    currencyPosition: settings?.currencyPosition || 'AFTER',
  }

  useEffect(() => {
    axios
      .get(`${API_URL}/settings`, { timeout: 8000 })
      .then((r) => r.data?.settings && setSettings(r.data.settings))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { origin, headers } = getSlaughterApiMode()
      const listUrl = isAdmin ? `${origin}/api/admin/slaughter/invoices` : `${origin}/api/mobile/vendor/slaughter/invoices`
      const params = {
        limit,
        offset: page * limit,
        ...(q.trim() && { q: q.trim() }),
        ...(invoiceNumber.trim() && { invoiceNumber: invoiceNumber.trim() }),
        ...(orderNumber.trim() && { orderNumber: orderNumber.trim() }),
        ...(orderStatus && { orderStatus }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      }
      const { data } = await axios.get(listUrl, { headers, params })
      setInvoices(data.invoices || [])
      setTotal(data.total || 0)
    } catch {
      toast.error(t('slaughterInvoices.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, invoiceNumber, isAdmin, orderNumber, orderStatus, page, q, t])

  useEffect(() => {
    load()
  }, [load])

  const pageTotal = invoices.reduce((s, inv) => s + (inv.order?.totalAmount || 0), 0)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ invoices, exportedAt: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `slaughter-invoices-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const resetFilters = () => {
    setQ('')
    setInvoiceNumber('')
    setOrderNumber('')
    setOrderStatus('')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  const toolbar = (
    <>
      <div className="ui-search">
        <SearchInput placeholder={t('slaughterInvoices.phSearch')} onDebouncedChange={(v) => { setQ(v); setPage(0) }} />
      </div>
      <input
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
        placeholder={t('slaughterInvoices.phInvoiceNo')}
        className="admin-input h-11 min-w-[120px]"
      />
      <input
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder={t('slaughterInvoices.phOrderNo')}
        className="admin-input h-11 min-w-[120px]"
      />
      <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="admin-input h-11 min-w-[130px]">
        <option value="">{t('slaughterOrders.allStatuses')}</option>
        {['PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED'].map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <div className="flex rounded-lg border border-[var(--admin-border)] p-0.5">
        <button
          type="button"
          className={`rounded-md p-2 ${viewMode === 'cards' ? 'bg-[var(--admin-accent)] text-white' : 'text-[var(--admin-text-muted)]'}`}
          onClick={() => setViewMode('cards')}
          title={t('slaughterInvoices.viewCards')}
        >
          <LayoutGrid className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className={`rounded-md p-2 ${viewMode === 'table' ? 'bg-[var(--admin-accent)] text-white' : 'text-[var(--admin-text-muted)]'}`}
          onClick={() => setViewMode('table')}
          title={t('slaughterInvoices.viewTable')}
        >
          <List className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={() => { setPage(0); load() }}>
        <RefreshCw className="h-4 w-4" aria-hidden />
        {t('slaughterOrders.refresh')}
      </button>
      <button type="button" className="ads-btn ads-btn-subtle" onClick={resetFilters}>
        {t('slaughterOrders.reset')}
      </button>
      {canCreate ? (
        <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={exportJson}>
          <FileText className="h-4 w-4" aria-hidden />
          {t('slaughterInvoices.export')}
        </button>
      ) : null}
    </>
  )

  const renderInvoiceCard = (inv) => (
    <article key={inv.id} className="admin-invoice-card">
      <div className="admin-invoice-card__head">
        <FileText className="h-5 w-5 shrink-0 text-[var(--admin-accent)]" aria-hidden />
        <code className="truncate font-mono text-sm font-bold text-[var(--admin-accent)]">{inv.invoiceNumber}</code>
        <Badge variant={STATUS_VARIANT[inv.order?.status] || 'default'}>{inv.order?.status || '—'}</Badge>
      </div>
      <p className="admin-invoice-card__amount">{formatCurrency(inv.order?.totalAmount || 0, cur)}</p>
      <dl className="admin-invoice-card__meta">
        <div>
          <dt>{t('slaughterOrders.colOrder')}</dt>
          <dd>
            <Link to={`/admin/slaughter/orders/${inv.order?.id}`} className="text-[var(--admin-text-link)]">
              {inv.order?.orderNumber}
            </Link>
          </dd>
        </div>
        {isAdmin ? (
          <div>
            <dt>{t('slaughterInvoices.colVendor')}</dt>
            <dd className="truncate">{inv.employer?.name || '—'}</dd>
          </div>
        ) : null}
        <div>
          <dt>{t('slaughterInvoices.colDate')}</dt>
          <dd>{new Date(inv.createdAt).toLocaleDateString(rtl ? 'ar-SA' : 'en-GB')}</dd>
        </div>
      </dl>
      <div className="admin-invoice-card__actions">
        <Link to={`/admin/slaughter/invoices/${inv.id}`} className="ads-btn ads-btn-primary h-9 flex-1 justify-center gap-1 text-xs">
          <Eye className="h-3.5 w-3.5" aria-hidden />
          {t('slaughterInvoices.view')}
        </Link>
      </div>
    </article>
  )

  return (
    <AdminPage
      title={t('slaughterInvoices.title')}
      subtitle={t('slaughterInvoices.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughterInvoices.title') },
      ]}
    >
      <AdminContent className="gap-6">
        <UiStats>
          <UiStat icon={Archive} iconTone="indigo" value={total} label={t('slaughterInvoices.statTotal')} />
          <UiStat icon={FileText} iconTone="emerald" value={invoices.length} label={t('slaughterInvoices.statPage')} />
          <UiStat icon={FileText} iconTone="amber" value={formatCurrency(pageTotal, cur)} label={t('slaughterInvoices.statPageAmount')} />
        </UiStats>

        <UiCard toolbar={toolbar} ariaLabel={t('slaughterInvoices.filters')}>
          <div className="grid gap-3 border-b border-[var(--admin-border)] px-5 py-4 sm:grid-cols-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="admin-input" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="admin-input" />
          </div>
          {loading ? (
            viewMode === 'table' ? (
              <UiTableSkeleton rows={8} cols={isAdmin ? 8 : 7} />
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
                ))}
              </div>
            )
          ) : !invoices.length ? (
            <div className="py-16 text-center text-[var(--admin-text-muted)]">{t('slaughterInvoices.empty')}</div>
          ) : viewMode === 'cards' ? (
            <>
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">{invoices.map(renderInvoiceCard)}</div>
              <Pagination
                currentPage={page + 1}
                totalPages={Math.ceil(total / limit) || 1}
                onPageChange={(p) => setPage(p - 1)}
                total={total}
                limit={limit}
              />
            </>
          ) : (
            <>
              <UiTable minWidth={900}>
                <thead>
                  <tr>
                    <th>{t('slaughterInvoices.colInvoice')}</th>
                    <th>{t('slaughterOrders.colOrder')}</th>
                    {isAdmin ? <th>{t('slaughterInvoices.colVendor')}</th> : null}
                    <th>{t('slaughterInvoices.colAmount')}</th>
                    <th>{t('slaughterOrders.colStatus')}</th>
                    <th>{t('slaughterInvoices.colBy')}</th>
                    <th>{t('slaughterInvoices.colDate')}</th>
                    <th className="text-end">{t('slaughterInvoices.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="cursor-pointer transition-colors hover:bg-[var(--admin-bg)]/60" onClick={() => navigate(`/admin/slaughter/invoices/${inv.id}`)}>
                      <td>
                        <code className="text-xs font-semibold text-[var(--admin-accent)]">{inv.invoiceNumber}</code>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Link className="font-medium text-[var(--admin-accent)] hover:underline" to={`/admin/slaughter/orders/${inv.order?.id}`}>
                          {inv.order?.orderNumber}
                        </Link>
                      </td>
                      {isAdmin ? (
                        <td className="text-sm text-[var(--admin-text-muted)]">{inv.employer?.name || inv.employer?.email || '—'}</td>
                      ) : null}
                      <td className="font-semibold text-[var(--admin-text)]">{formatCurrency(inv.order?.totalAmount || 0, cur)}</td>
                      <td>
                        <Badge variant={STATUS_VARIANT[inv.order?.status] || 'default'}>{inv.order?.status || '—'}</Badge>
                      </td>
                      <td className="text-sm text-[var(--admin-text-muted)]">{inv.createdBy?.name || '—'}</td>
                      <td className="text-sm text-[var(--admin-text-muted)]">{new Date(inv.createdAt).toLocaleString()}</td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <Link to={`/admin/slaughter/invoices/${inv.id}`} className="ui-action-btn inline-flex">
                          <Eye size={16} aria-hidden />
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
