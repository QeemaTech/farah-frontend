import { API_URL, getSlaughterApiMode, hasPermission, readAdminUser } from '../utils/adminSession'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Archive, Calendar, Download, FileText, Mail, Printer, Save, User } from 'lucide-react'
import Barcode from 'react-barcode'
import { useReactToPrint } from 'react-to-print'
import AdminDetailShell from '../components/AdminDetailShell'
import { UiCard } from '../design-system'
import { formatCurrency } from '../../utils/currency'

const ORDER_STATUS_I18N = {
  PENDING: 'stPending',
  CONFIRMED: 'stConfirmed',
  PROCESSING: 'stProcessing',
  DELIVERED: 'stDelivered',
  CANCELLED: 'stCancelled',
}

function lineItemLabel(it, preferAr) {
  const base = preferAr ? it.product?.nameAr || it.product?.name : it.product?.name || it.product?.nameAr
  const w = it.variant?.weightKg != null ? ` (${it.variant.weightKg} kg)` : ''
  return `${base || '—'}${w}`
}

export default function SlaughterOrderDetail() {
  const { orderId } = useParams()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const invoiceRef = useRef(null)
  const [order, setOrder] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingInv, setSavingInv] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const user = readAdminUser()
  const canSaveInvoice = hasPermission(user, 'slaughter_invoices', 'create')
  const cur = useMemo(
    () => ({
      currencySymbol: settings?.currencySymbol || settings?.currencyCode || 'ر.س',
      currencyCode: settings?.currencyCode || 'SAR',
      currencyDecimals: settings?.currencyDecimals != null ? settings.currencyDecimals : 2,
      currencyPosition: settings?.currencyPosition || 'AFTER',
    }),
    [settings],
  )

  useEffect(() => {
    axios
      .get(`${API_URL}/settings`, { timeout: 8000 })
      .then((r) => r.data?.settings && setSettings(r.data.settings))
      .catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { origin, headers, useVendorProductApi } = getSlaughterApiMode()
      const url = useVendorProductApi
        ? `${origin}/api/mobile/vendor/slaughter/orders/${orderId}`
        : `${origin}/api/admin/slaughter/orders/${orderId}`
      const { data } = await axios.get(url, { headers })
      setOrder(data.order || null)
    } catch {
      toast.error(t('slaughterOrderDetail.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const saveInvoice = async () => {
    if (!canSaveInvoice) return
    setSavingInv(true)
    try {
      const { origin, headers, useVendorProductApi } = getSlaughterApiMode()
      if (!useVendorProductApi) {
        toast.error(t('slaughterOrderDetail.invoiceVendorOnly'))
        return
      }
      await axios.post(`${origin}/api/mobile/vendor/slaughter/invoices`, { orderId }, { headers })
      toast.success(t('slaughterOrderDetail.invoiceSaved'))
    } catch (e) {
      toast.error(e.response?.data?.error || t('messages.error'))
    } finally {
      setSavingInv(false)
    }
  }

  const downloadSnapshot = () => {
    if (!order) return
    const blob = new Blob([JSON.stringify(order, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `slaughter-order-${order.orderNumber}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const mailToClient = () => {
    if (!order?.customer?.email) {
      toast.error(t('slaughterOrderDetail.noCustomerEmail'))
      return
    }
    const subject = encodeURIComponent(t('slaughterOrderDetail.emailSubject', { n: order.orderNumber }))
    const body = encodeURIComponent(
      t('slaughterOrderDetail.emailBody', { n: order.orderNumber, total: formatCurrency(order.totalAmount || 0, cur) }),
    )
    window.location.href = `mailto:${order.customer.email}?subject=${subject}&body=${body}`
  }

  const orderStatusLabel = (o) => {
    if (!o?.status) return '—'
    const key = ORDER_STATUS_I18N[o.status]
    return key ? t(`slaughterOrders.${key}`) : o.status
  }

  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `slaughter-invoice-${order?.orderNumber || orderId || 'order'}`,
    onBeforePrint: async () => {
      toast(t('slaughterOrderDetail.preparingPrint'), { icon: 'ℹ️', duration: 2000 })
    },
    onAfterPrint: () => {
      toast.success(t('slaughterOrderDetail.printSuccess'))
    },
    onPrintError: (_loc, err) => {
      console.error(err)
      toast.error(t('slaughterOrderDetail.printFailed'))
    },
  })

  const generateInvoicePdf = async () => {
    if (!order) {
      toast.error(t('slaughterOrderDetail.notFound'))
      return
    }
    const ar = rtl
    setGeneratingPdf(true)
    try {
      const pdfMakeMod = await import('pdfmake-rtl/build/pdfmake')
      const vfsMod = await import('pdfmake-rtl/build/vfs_fonts')
      const pdfMake = pdfMakeMod.default ?? pdfMakeMod
      const vfs = vfsMod.default ?? vfsMod
      if (vfs && typeof vfs === 'object') {
        pdfMake.vfs = vfs
      }

      const pdfFonts = {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf',
        },
        Nillima: {
          normal: 'Nillima.ttf',
          bold: 'Nillima.ttf',
          italics: 'Nillima.ttf',
          bolditalics: 'Nillima.ttf',
        },
      }
      // pdfmake-rtl may register Nillima without all styles; overwrite so Arabic + emphasis never requests missing faces
      pdfMake.fonts = { ...pdfFonts }

      const cellHead = (text, alignment) => ({
        text,
        fontSize: 10,
        fillColor: '#2d2871',
        color: '#ffffff',
        alignment,
      })

      const items = order.items || []
      const itemsHeader = [
        cellHead(ar ? 'البند' : 'Item', ar ? 'right' : 'left'),
        cellHead(ar ? 'الكمية' : 'Qty', 'center'),
        cellHead(ar ? 'سعر الوحدة' : 'Unit', ar ? 'right' : 'left'),
        cellHead(ar ? 'الإجمالي' : 'Line', ar ? 'right' : 'left'),
      ]
      const itemsBody = [itemsHeader]
      items.forEach((it, index) => {
        const fillColor = index % 2 === 0 ? '#f5f5f5' : '#ffffff'
        itemsBody.push([
          { text: lineItemLabel(it, ar), alignment: ar ? 'right' : 'left', fillColor },
          { text: String(it.quantity ?? 0), alignment: 'center', fillColor },
          { text: formatCurrency(it.unitPrice || 0, cur), alignment: ar ? 'right' : 'left', fillColor },
          { text: formatCurrency(it.totalPrice || 0, cur), alignment: ar ? 'right' : 'left', fillColor },
        ])
      })

      const labelCell = (text, fill) => ({
        text,
        fontSize: 10,
        color: '#2d2871',
        alignment: ar ? 'right' : 'left',
        ...(fill ? { fillColor: '#f5f5f5' } : {}),
      })
      const valueCell = (text, fill) => ({
        text,
        fontSize: 10,
        alignment: ar ? 'right' : 'left',
        ...(fill ? { fillColor: '#f5f5f5' } : {}),
      })

      const detailsRows = [
        [labelCell(ar ? 'رقم الطلب' : 'Order #', false), valueCell(order.orderNumber || '—', false)],
        [
          labelCell(ar ? 'التاريخ' : 'Date', true),
          valueCell(new Date(order.createdAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US'), true),
        ],
        [labelCell(ar ? 'الحالة' : 'Status', false), valueCell(orderStatusLabel(order), false)],
        [
          labelCell(ar ? 'عدد الضيوف' : 'Guests', true),
          valueCell(String(order.guestCount ?? '—'), true),
        ],
        [labelCell(ar ? 'نوع التسليم' : 'Delivery', false), valueCell(order.deliveryType || '—', false)],
      ]
      if (order.occasionType) {
        detailsRows.push([
          labelCell(ar ? 'المناسبة' : 'Occasion', true),
          valueCell(order.occasionType, true),
        ])
      }
      if (order.booking?.bookingNumber) {
        detailsRows.push([
          labelCell(ar ? 'مرتبط بحجز' : 'Linked booking', false),
          valueCell(order.booking.bookingNumber, false),
        ])
      }
      if (order.budget != null) {
        detailsRows.push([
          labelCell(ar ? 'الميزانية' : 'Budget', true),
          valueCell(formatCurrency(order.budget, cur), true),
        ])
      }

      const detailsTable = {
        headerRows: 0,
        widths: ['*', '*'],
        body: detailsRows,
      }

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 56, 40, 56],
        pageDirection: ar ? 'rtl' : 'ltr',
        fonts: pdfFonts,
        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
          alignment: ar ? 'right' : 'left',
        },
        content: [
          {
            columns: [
              {
                text: 'Farah',
                font: 'Roboto',
                fontSize: 22,
                color: '#2d2871',
                width: 'auto',
              },
              {
                stack: [
                  {
                    text: ar ? 'فاتورة ذبيحة' : 'Slaughter invoice',
                    fontSize: 17,
                    color: '#1f1a5a',
                    alignment: ar ? 'right' : 'left',
                  },
                  {
                    text: `${ar ? 'رقم الطلب' : 'Order'}: ${order.orderNumber || order.id}`,
                    fontSize: 10,
                    alignment: ar ? 'right' : 'left',
                    margin: [0, 6, 0, 0],
                  },
                  {
                    text: `${ar ? 'التاريخ' : 'Date'}: ${new Date(order.createdAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}`,
                    fontSize: 10,
                    alignment: ar ? 'right' : 'left',
                  },
                ],
                alignment: ar ? 'right' : 'left',
                width: '*',
              },
            ],
            margin: [0, 0, 0, 14],
          },
          {
            text: ar ? 'نظام إدارة الحفلات والمناسبات' : 'Event management system',
            fontSize: 9,
            color: '#666',
            margin: [0, 0, 0, 4],
          },
          {
            text: ar ? 'المملكة العربية السعودية' : 'Saudi Arabia',
            fontSize: 9,
            color: '#666',
            margin: [0, 0, 0, 14],
          },
          {
            columns: [
              {
                stack: [
                  {
                    text: ar ? 'معلومات العميل' : 'Customer',
                    fontSize: 12,
                    color: '#2d2871',
                    margin: [0, 0, 0, 8],
                  },
                  { text: `${ar ? 'الاسم' : 'Name'}: ${order.customer?.name || (ar ? 'غير متوفر' : 'N/A')}`, margin: [0, 0, 0, 4] },
                  { text: `${ar ? 'الهاتف' : 'Phone'}: ${order.customer?.phone || (ar ? 'غير متوفر' : 'N/A')}`, margin: [0, 0, 0, 4] },
                  { text: `${ar ? 'البريد' : 'Email'}: ${order.customer?.email || (ar ? 'غير متوفر' : 'N/A')}`, margin: [0, 0, 0, 4] },
                ],
                width: '*',
                margin: [0, 0, 8, 14],
              },
              {
                stack: [
                  {
                    text: ar ? 'ملخص الطلب' : 'Order summary',
                    fontSize: 12,
                    color: '#2d2871',
                    margin: [0, 0, 0, 8],
                  },
                  {
                    text: `${ar ? 'الإجمالي' : 'Total'}: ${formatCurrency(order.totalAmount || 0, cur)}`,
                    fontSize: 12,
                    margin: [0, 4, 0, 0],
                  },
                ],
                width: '*',
                margin: [0, 0, 0, 14],
              },
            ],
          },
          { text: ar ? 'تفاصيل الطلب' : 'Order details', fontSize: 11, color: '#2d2871', margin: [0, 0, 0, 8] },
          { table: detailsTable, margin: [0, 0, 0, 14] },
          { text: ar ? 'البنود' : 'Line items', fontSize: 11, color: '#2d2871', margin: [0, 0, 0, 8] },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto'],
              body: itemsBody,
            },
            margin: [0, 0, 0, 14],
          },
          {
            stack: [
              {
                text: `${ar ? 'الإجمالي' : 'Total'}: ${formatCurrency(order.totalAmount || 0, cur)}`,
                fontSize: 13,
                color: '#2d2871',
                alignment: ar ? 'right' : 'left',
              },
            ],
            fillColor: '#f0f0f5',
            margin: [0, 0, 0, 14],
          },
          ...(order.notes
            ? [
                { text: ar ? 'ملاحظات' : 'Notes', fontSize: 11, color: '#2d2871', margin: [0, 0, 0, 6] },
                { text: order.notes, fontSize: 9, margin: [0, 0, 0, 14] },
              ]
            : []),
          {
            text: ar ? 'شكراً لاختياركم فرح' : 'Thank you for choosing Farah',
            fontSize: 8,
            alignment: 'center',
            color: '#666',
            margin: [0, 10, 0, 4],
          },
          {
            text: ar ? 'للاستفسارات: info@farah.com' : 'Inquiries: info@farah.com',
            fontSize: 8,
            alignment: 'center',
            color: '#666',
          },
        ],
      }

      const fileName = `slaughter-invoice-${order.orderNumber || order.id}-${Date.now()}.pdf`
      pdfMake.createPdf(docDefinition).download(fileName)
      toast.success(t('slaughterOrderDetail.invoiceDownloaded'))
    } catch (e) {
      console.error(e)
      toast.error(t('slaughterOrderDetail.errorGeneratingPdf', { message: e?.message || String(e) }))
    } finally {
      setGeneratingPdf(false)
    }
  }

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {hasPermission(user, 'slaughter_invoices', 'read') ? (
        <Link to="/admin/slaughter/invoices" className="ads-btn ads-btn-subtle gap-2">
          <Archive className="h-4 w-4" aria-hidden />
          {t('slaughterOrderDetail.invoiceArchive')}
        </Link>
      ) : null}
      <button type="button" className="ads-btn ads-btn-subtle gap-2" disabled={!order} onClick={handlePrintInvoice}>
        <Printer className="h-4 w-4" aria-hidden />
        {t('slaughterOrderDetail.printInvoice')}
      </button>
      <button type="button" className="ads-btn ads-btn-subtle gap-2" disabled={!order || generatingPdf} onClick={generateInvoicePdf}>
        <Download className="h-4 w-4" aria-hidden />
        {generatingPdf ? t('slaughterOrderDetail.generatingPdf') : t('slaughterOrderDetail.downloadPdf')}
      </button>
      <button type="button" className="ads-btn ads-btn-subtle gap-2" disabled={!order} onClick={downloadSnapshot}>
        <Download className="h-4 w-4" aria-hidden />
        {t('slaughterOrderDetail.downloadJson')}
      </button>
      <button type="button" className="ads-btn ads-btn-subtle gap-2" disabled={!order} onClick={mailToClient}>
        <Mail className="h-4 w-4" aria-hidden />
        {t('slaughterOrderDetail.sendEmail')}
      </button>
      {canSaveInvoice ? (
        <button type="button" disabled={savingInv || !order} onClick={saveInvoice} className="ads-btn ads-btn-primary gap-2">
          <Save className="h-4 w-4" aria-hidden />
          {t('slaughterOrderDetail.saveInvoice')}
        </button>
      ) : null}
    </div>
  )

  return (
    <AdminDetailShell
      title={t('slaughterOrderDetail.title')}
      subtitle={order?.orderNumber || orderId}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughterOrders.title'), path: '/admin/slaughter/orders' },
        { label: t('slaughterOrderDetail.title') },
      ]}
      backTo="/admin/slaughter/orders"
      backLabel={t('slaughterOrderDetail.back')}
      action={headerActions}
      noCard
    >
      <div className="mx-auto max-w-3xl space-y-4 print:max-w-none" dir={rtl ? 'rtl' : 'ltr'}>
        {loading ? (
          <div className="p-10 text-center text-[var(--admin-text-muted)]">{t('slaughterOrders.loading')}</div>
        ) : !order ? (
          <div className="p-10 text-center text-[var(--admin-text-muted)]">{t('slaughterOrderDetail.notFound')}</div>
        ) : (
          <div
            ref={invoiceRef}
            className="invoice-content mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-card)] print:border-0 print:shadow-none"
          >
            <div
              className="px-6 py-7 text-white md:px-8 md:py-8"
              style={{
                background: 'linear-gradient(135deg, var(--admin-accent) 0%, color-mix(in srgb, var(--admin-accent) 70%, #1e293b) 100%)',
              }}
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/70">Farah</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{t('slaughterOrderDetail.invoiceTitle')}</h1>
                  <p className="mt-2 max-w-md text-sm text-white/85">{t('slaughterOrderDetail.invoiceTagline')}</p>
                </div>
                <div className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm md:text-end">
                  <p className="text-xs text-white/75">{t('slaughterOrders.colOrder')}</p>
                  <p className="font-mono text-lg font-semibold tracking-wide">{order.orderNumber}</p>
                  <p className="mt-2 text-xs text-white/75">{t('slaughterOrderDetail.invoiceDate')}</p>
                  <p className="text-sm font-medium">
                    {new Date(order.createdAt).toLocaleDateString(rtl ? 'ar-EG' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-[var(--admin-border)] bg-[var(--admin-bg)] px-4 py-5">
              <div className="flex flex-col items-center justify-center">
                <Barcode
                  value={order.orderNumber || order.id}
                  format="CODE128"
                  width={1.8}
                  height={48}
                  displayValue
                  fontSize={12}
                />
                <p className="mt-2 max-w-md text-center text-xs text-[var(--admin-text-muted)]">
                  {t('slaughterOrderDetail.invoiceBarcodeHint')}
                </p>
              </div>
            </div>

            <div className="p-5 md:p-8">
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] p-5">
                  <div className="mb-3 flex items-center gap-2 border-b border-[var(--admin-border)] pb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--admin-accent)] text-white">
                      <User className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t('slaughterOrderDetail.customer')}</h3>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                      <dt className="text-[var(--admin-text-muted)]">{t('slaughterOrderDetail.invoiceName')}</dt>
                      <dd className="font-medium text-[var(--admin-text)]">{order.customer?.name || '—'}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                      <dt className="text-[var(--admin-text-muted)]">{t('slaughterOrderDetail.invoicePhone')}</dt>
                      <dd className="font-medium text-[var(--admin-text)]">{order.customer?.phone || '—'}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                      <dt className="text-[var(--admin-text-muted)]">{t('slaughterOrderDetail.invoiceEmail')}</dt>
                      <dd className="break-all font-medium text-[var(--admin-text)]">{order.customer?.email || '—'}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] p-5">
                  <div className="mb-3 flex items-center gap-2 border-b border-[var(--admin-border)] pb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t('slaughterOrderDetail.meta')}</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-[var(--admin-text)]">
                    <li className="flex justify-between gap-3">
                      <span className="text-[var(--admin-text-muted)]">{t('slaughterOrderDetail.status')}</span>
                      <span className="font-medium">{orderStatusLabel(order)}</span>
                    </li>
                    <li className="flex justify-between gap-3">
                      <span className="text-[var(--admin-text-muted)]">{t('slaughterOrders.colGuests')}</span>
                      <span>{order.guestCount}</span>
                    </li>
                    <li className="flex justify-between gap-3">
                      <span className="text-[var(--admin-text-muted)]">{t('slaughterOrderDetail.delivery')}</span>
                      <span>{order.deliveryType}</span>
                    </li>
                    {order.booking?.bookingNumber ? (
                      <li className="flex justify-between gap-3">
                        <span className="text-[var(--admin-text-muted)]">{t('slaughterOrders.colBooking')}</span>
                        <span className="font-mono text-xs">{order.booking.bookingNumber}</span>
                      </li>
                    ) : null}
                    {order.occasionType ? (
                      <li className="flex justify-between gap-3">
                        <span className="text-[var(--admin-text-muted)]">{t('slaughterOrderDetail.occasion')}</span>
                        <span>{order.occasionType}</span>
                      </li>
                    ) : null}
                    {order.budget != null ? (
                      <li className="flex justify-between gap-3">
                        <span className="text-[var(--admin-text-muted)]">{t('slaughterOrderDetail.budget')}</span>
                        <span>{formatCurrency(order.budget, cur)}</span>
                      </li>
                    ) : null}
                  </ul>
                  <div className="mt-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                    <p className="text-xs text-[var(--admin-text-muted)]">{t('slaughterOrders.colTotal')}</p>
                    <p className="mt-1 text-xl font-semibold text-[var(--admin-accent)]">
                      {formatCurrency(order.totalAmount || 0, cur)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--admin-accent)]" />
                <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t('slaughterOrderDetail.items')}</h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)]">
                <table className="ui-table w-full min-w-[320px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[var(--admin-accent)] text-white">
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${rtl ? 'text-end' : 'text-start'}`}>
                        {t('slaughterDetail.colVariant')}
                      </th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${rtl ? 'text-end' : 'text-start'}`}>
                        {t('slaughterOrderDetail.qty')}
                      </th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${rtl ? 'text-end' : 'text-start'}`}>
                        {t('slaughterOrderDetail.unit')}
                      </th>
                      <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${rtl ? 'text-end' : 'text-start'}`}>
                        {t('slaughterOrderDetail.line')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((it, idx) => (
                      <tr
                        key={it.id}
                        className={idx % 2 === 0 ? 'bg-[var(--admin-surface)]' : 'bg-[var(--admin-bg)]'}
                      >
                        <td className={`border-t border-[var(--admin-border)] px-4 py-3 text-[var(--admin-text)] ${rtl ? 'text-end' : 'text-start'}`}>
                          {lineItemLabel(it, rtl)}
                        </td>
                        <td
                          className={`border-t border-[var(--admin-border)] px-4 py-3 text-[var(--admin-text)] ${rtl ? 'text-end' : 'text-start'}`}
                        >
                          {it.quantity}
                        </td>
                        <td
                          className={`border-t border-[var(--admin-border)] px-4 py-3 text-[var(--admin-text)] ${rtl ? 'text-end' : 'text-start'}`}
                        >
                          {formatCurrency(it.unitPrice || 0, cur)}
                        </td>
                        <td
                          className={`border-t border-[var(--admin-border)] px-4 py-3 font-semibold text-[var(--admin-accent)] ${rtl ? 'text-end' : 'text-start'}`}
                        >
                          {formatCurrency(it.totalPrice || 0, cur)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {order.notes ? (
                <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
                    {t('slaughterOrderDetail.notes')}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--admin-text)]">{order.notes}</p>
                </div>
              ) : null}

              <div className="mt-6 border-t border-[var(--admin-border)] pt-5 text-center text-xs text-[var(--admin-text-muted)]">
                <p className="font-medium text-[var(--admin-text)]">{t('slaughterOrderDetail.invoiceFooterThanks')}</p>
                <p className="mt-1">{t('slaughterOrderDetail.invoiceFooterContact')}</p>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @media print {
            @page {
              margin: 12mm;
              size: A4;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:border-0 {
              border: none !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    </AdminDetailShell>
  )
}
