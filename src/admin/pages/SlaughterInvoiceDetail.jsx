import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Download, FileText, User, Store, Calendar } from 'lucide-react'
import AdminDetailShell from '../components/AdminDetailShell'
import { AdminContent, Badge, UiCard } from '../design-system'
import { API_URL, getSlaughterApiMode, isFullAdminUser, readAdminUser } from '../utils/adminSession'
import { formatCurrency } from '../../utils/currency'
import VatTotals from '../../components/VatTotals'

const STATUS_VARIANT = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'default',
  DELIVERED: 'success',
  CANCELLED: 'danger',
}

export default function SlaughterInvoiceDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const isAdmin = isFullAdminUser(readAdminUser())
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)

  const cur = useMemo(
    () => ({
      currencySymbol: settings?.currencySymbol || 'ر.س',
      currencyCode: settings?.currencyCode || 'SAR',
      currencyDecimals: settings?.currencyDecimals ?? 2,
      currencyPosition: settings?.currencyPosition || 'AFTER',
    }),
    [settings],
  )

  useEffect(() => {
    axios.get(`${API_URL}/settings`, { timeout: 8000 }).then((r) => r.data?.settings && setSettings(r.data.settings)).catch(() => {})
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const { origin, headers } = getSlaughterApiMode()
        const url = isAdmin
          ? `${origin}/api/admin/slaughter/invoices/${id}`
          : `${origin}/api/mobile/vendor/slaughter/invoices/${id}`
        const { data } = await axios.get(url, { headers })
        setInvoice(data.invoice)
      } catch (e) {
        toast.error(e.response?.data?.error || t('slaughterInvoiceDetail.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id, isAdmin, t])

  const snap = invoice?.snapshot || {}
  const items = snap.items || invoice?.order?.items || []
  const vatRecord = snap.subtotalExVat != null ? snap : invoice?.order

  const lineLabel = (it) => {
    const p = it.product
    if (!p) return '—'
    return language === 'ar' ? p.nameAr || p.name : p.name || p.nameAr
  }

  const downloadSnapshot = () => {
    const blob = new Blob([JSON.stringify(invoice?.snapshot || invoice, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${invoice?.invoiceNumber || 'invoice'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const vendorName =
    invoice?.employer?.vendorProfile?.businessName || invoice?.employer?.name || invoice?.employer?.email

  return (
    <AdminDetailShell
      title={invoice?.invoiceNumber || t('slaughterInvoiceDetail.title')}
      subtitle={t('slaughterInvoiceDetail.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughterInvoices.title'), path: '/admin/slaughter/invoices' },
        { label: invoice?.invoiceNumber || t('slaughterInvoiceDetail.title') },
      ]}
      backTo="/admin/slaughter/invoices"
      backLabel={t('slaughterInvoiceDetail.back')}
      action={
        invoice ? (
          <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={downloadSnapshot}>
            <Download className="h-4 w-4" aria-hidden />
            {t('slaughterInvoices.download')}
          </button>
        ) : null
      }
      loading={loading}
      empty={!loading && !invoice}
      emptyTitle={t('slaughterInvoiceDetail.notFound')}
      noCard
    >
      {invoice ? (
        <AdminContent className="gap-6">
          <div className="admin-entity-hero admin-entity-hero--compact">
            <div className="admin-entity-hero__visual admin-entity-hero__img--icon">
              <div className="admin-entity-hero__placeholder">
                <FileText className="h-12 w-12 text-[var(--admin-accent)]" aria-hidden />
              </div>
            </div>
            <div className="admin-entity-hero__body">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono">{invoice.invoiceNumber}</h2>
                <Badge variant={STATUS_VARIANT[invoice.order?.status || snap.status] || 'default'}>
                  {invoice.order?.status || snap.status || '—'}
                </Badge>
              </div>
              <p className="admin-entity-hero__muted">
                {t('slaughterInvoiceDetail.issued')}{' '}
                {new Date(invoice.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-GB')}
              </p>
              <p className="text-2xl font-bold text-[var(--admin-accent)]">
                {formatCurrency(
                  snap.totalInclVat ?? invoice?.order?.totalInclVat ?? snap.totalAmount ?? invoice?.order?.totalAmount ?? 0,
                  cur,
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <UiCard className="admin-invoice-meta-card">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--admin-text)]">
                <User className="h-4 w-4 text-[var(--admin-accent)]" aria-hidden />
                {t('slaughterInvoiceDetail.customer')}
              </div>
              <p className="font-medium">{(snap.customer || invoice.order?.customer)?.name || '—'}</p>
              <p className="text-sm text-[var(--admin-text-muted)]">{(snap.customer || invoice.order?.customer)?.phone || '—'}</p>
            </UiCard>
            {isAdmin ? (
              <UiCard className="admin-invoice-meta-card">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--admin-text)]">
                  <Store className="h-4 w-4 text-[var(--admin-accent)]" aria-hidden />
                  {t('slaughterInvoices.colVendor')}
                </div>
                <p className="font-medium">{vendorName || '—'}</p>
                <p className="text-sm text-[var(--admin-text-muted)]">{invoice.employer?.phone || invoice.employer?.email || '—'}</p>
              </UiCard>
            ) : null}
            <UiCard className="admin-invoice-meta-card">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--admin-text)]">
                <Calendar className="h-4 w-4 text-[var(--admin-accent)]" aria-hidden />
                {t('slaughterInvoiceDetail.linkedOrder')}
              </div>
              {invoice.order?.id ? (
                <Link to={`/admin/slaughter/orders/${invoice.order.id}`} className="font-mono font-semibold text-[var(--admin-text-link)]">
                  {invoice.order.orderNumber || snap.orderNumber}
                </Link>
              ) : (
                <span className="font-mono">{snap.orderNumber || '—'}</span>
              )}
              <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
                {t('slaughterInvoices.colBy')}: {invoice.createdBy?.name || '—'}
              </p>
            </UiCard>
          </div>

          <UiCard>
            <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('slaughterInvoiceDetail.lineItems')}</h3>
            <div className="admin-payment-lines">
              {items.map((it, idx) => (
                <div key={idx} className="admin-payment-line">
                  <span>
                    {lineLabel(it)} × {it.quantity ?? 1}
                  </span>
                  <span className="font-semibold text-[var(--admin-text)]">
                    {formatCurrency(it.totalPrice ?? (it.unitPrice || 0) * (it.quantity || 1), cur)}
                  </span>
                </div>
              ))}
              <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
                <VatTotals record={vatRecord} currencySettings={cur} />
              </div>
            </div>
          </UiCard>

          {(snap.notes || snap.occasionType || snap.deliveryType) && (
            <UiCard>
              <h3 className="mb-3 text-base font-bold text-[var(--admin-text)]">{t('slaughterInvoiceDetail.orderMeta')}</h3>
              <dl className="admin-detail-grid">
                {snap.occasionType ? (
                  <div className="admin-detail-row">
                    <dt className="admin-detail-row__label">{t('slaughterInvoiceDetail.occasion')}</dt>
                    <dd className="admin-detail-row__value">{snap.occasionType}</dd>
                  </div>
                ) : null}
                {snap.deliveryType ? (
                  <div className="admin-detail-row">
                    <dt className="admin-detail-row__label">{t('slaughterInvoiceDetail.delivery')}</dt>
                    <dd className="admin-detail-row__value">{snap.deliveryType}</dd>
                  </div>
                ) : null}
                {snap.notes ? (
                  <div className="admin-detail-row">
                    <dt className="admin-detail-row__label">{t('venueBookingDetail.notes')}</dt>
                    <dd className="admin-detail-row__value">{snap.notes}</dd>
                  </div>
                ) : null}
              </dl>
            </UiCard>
          )}
        </AdminContent>
      ) : null}
    </AdminDetailShell>
  )
}
