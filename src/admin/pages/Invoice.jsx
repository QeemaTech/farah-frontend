import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import { API_URL, getMarketplaceVendorApiConfig, usesProviderApis } from '../utils/adminSession'
import {
  Download,
  Printer,
  ArrowRight,
  FileText,
  Calendar,
  User,
  MapPin,
  DollarSign,
} from 'lucide-react'
import Barcode from 'react-barcode'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import VatTotals from '../../components/VatTotals'
import { resolveVatFromRecord } from '../../utils/vat'
function Invoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const componentRef = useRef(null)

  useEffect(() => {
    fetchBooking()
  }, [id])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const vendorApi = getMarketplaceVendorApiConfig()
      const base = usesProviderApis() ? vendorApi.bookingsUrl : `${API_URL}/admin/bookings`
      const response = await axios.get(`${base}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBooking(response.data.booking)
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.error(error.response?.data?.error || t('errorLoadingBooking', { ar: 'خطأ في تحميل الحجز', en: 'Error loading booking' }))
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (!booking) {
      toast.error(t('noBookingData', { ar: 'لا توجد بيانات الحجز', en: 'No booking data' }))
      return
    }

    setGenerating(true)
    try {
      // pdfmake requires vfs fonts (bundled in pdfmake-rtl); default entry does not attach vfs
      const pdfMakeMod = await import('pdfmake-rtl/build/pdfmake')
      const vfsMod = await import('pdfmake-rtl/build/vfs_fonts')
      const pdfMake = pdfMakeMod.default ?? pdfMakeMod
      const vfs = vfsMod.default ?? vfsMod
      if (vfs && typeof vfs === 'object') {
        pdfMake.vfs = vfs
      }

      const eventDate = booking.date || booking.createdAt
      const venuePrice = booking.venue?.price || 0
      const servicesTotal = booking.services?.reduce((sum, s) => {
        const servicePrice = s.service?.price || s.price || 0
        return sum + servicePrice
      }, 0) || 0
      const discount = booking.discount || 0
      const total = booking.finalAmount || (venuePrice + servicesTotal - discount)
      const pdfVat = resolveVatFromRecord(booking, total)

      // Booking details table data
      const bookingDetailsTable = {
        headerRows: 1,
        widths: ['*', '*'],
        body: [
          [{ text: language === 'ar' ? 'المعلومة' : 'Information', bold: true, fillColor: '#2d2871', color: '#ffffff', alignment: 'right' },
           { text: language === 'ar' ? 'القيمة' : 'Value', bold: true, fillColor: '#2d2871', color: '#ffffff', alignment: 'right' }],
          [{ text: language === 'ar' ? 'تاريخ الحجز' : 'Booking Date', bold: true, alignment: 'right' }, 
           { text: new Date(eventDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'), alignment: 'right' }],
          [{ text: language === 'ar' ? 'وقت البدء' : 'Start Time', bold: true, alignment: 'right', fillColor: '#f5f5f5' }, 
           { text: booking.startTime || (language === 'ar' ? 'غير محدد' : 'Not specified'), alignment: 'right', fillColor: '#f5f5f5' }],
          [{ text: language === 'ar' ? 'وقت الانتهاء' : 'End Time', bold: true, alignment: 'right' }, 
           { text: booking.endTime || (language === 'ar' ? 'غير محدد' : 'Not specified'), alignment: 'right' }],
          [{ text: language === 'ar' ? 'الحالة' : 'Status', bold: true, alignment: 'right', fillColor: '#f5f5f5' }, 
           { text: getStatusText(booking.status), alignment: 'right', fillColor: '#f5f5f5' }],
          [{ text: language === 'ar' ? 'حالة الدفع' : 'Payment Status', bold: true, alignment: 'right' }, 
           { text: getPaymentStatusText(booking.paymentStatus), alignment: 'right' }],
        ]
      }

      // Services table data
      const servicesTableBody = [
        [{ text: language === 'ar' ? 'الخدمة' : 'Service', bold: true, fillColor: '#2d2871', color: '#ffffff', alignment: 'right' },
         { text: language === 'ar' ? 'السعر' : 'Price', bold: true, fillColor: '#2d2871', color: '#ffffff', alignment: 'right' },
         { text: language === 'ar' ? 'الكمية' : 'Quantity', bold: true, fillColor: '#2d2871', color: '#ffffff', alignment: 'right' }]
      ]

      if (booking.services && booking.services.length > 0) {
        booking.services.forEach((bookingService, index) => {
          const service = bookingService.service || bookingService
          const fillColor = index % 2 === 0 ? '#f5f5f5' : '#ffffff'
          servicesTableBody.push([
            { text: service.nameAr || service.name || (language === 'ar' ? 'خدمة' : 'Service'), alignment: 'right', fillColor },
            { text: `${(service.price || 0).toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}`, alignment: 'right', fillColor },
            { text: '1', alignment: 'right', fillColor }
          ])
        })
      }

      const servicesTable = {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: servicesTableBody
      }

      // Register vfs fonts (pdfmake-rtl switches Arabic to Nillima; map all styles or it throws on bold)
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

      // PDF document definition with RTL support
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        pageDirection: language === 'ar' ? 'rtl' : 'ltr',
        fonts: pdfFonts,
        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
          alignment: language === 'ar' ? 'right' : 'left'
        },
        content: [
          // Header
          {
            columns: [
              {
                text: 'Farah',
                fontSize: 24,
                bold: true,
                color: '#2d2871',
                width: 'auto'
              },
              {
                stack: [
                  { text: language === 'ar' ? 'فاتورة حجز' : 'Booking Invoice', fontSize: 18, bold: true, alignment: language === 'ar' ? 'right' : 'left' },
                  { text: `${language === 'ar' ? 'رقم الفاتورة' : 'Invoice No'}: ${booking.bookingNumber || booking.id.substring(0, 8).toUpperCase()}`, fontSize: 10, alignment: language === 'ar' ? 'right' : 'left', margin: [0, 5, 0, 0] },
                  { text: `${language === 'ar' ? 'التاريخ' : 'Date'}: ${new Date(booking.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}`, fontSize: 10, alignment: language === 'ar' ? 'right' : 'left' }
                ],
                alignment: language === 'ar' ? 'right' : 'left',
                width: '*'
              }
            ],
            margin: [0, 0, 0, 20]
          },
          {
            text: language === 'ar' ? 'نظام إدارة الحفلات والمناسبات' : 'Event Management System',
            fontSize: 10,
            color: '#666',
            alignment: language === 'ar' ? 'right' : 'left',
            margin: [0, 0, 0, 5]
          },
          {
            text: language === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia',
            fontSize: 10,
            color: '#666',
            alignment: language === 'ar' ? 'right' : 'left',
            margin: [0, 0, 0, 20]
          },
          // Customer and Venue Info
          {
            columns: [
              {
                stack: [
                  { text: language === 'ar' ? 'معلومات العميل' : 'Customer Information', fontSize: 12, bold: true, color: '#2d2871', margin: [0, 0, 0, 10] },
                  { text: `${language === 'ar' ? 'الاسم' : 'Name'}: ${booking.customer?.nameAr || booking.customer?.name || (language === 'ar' ? 'غير متوفر' : 'N/A')}`, margin: [0, 0, 0, 5] },
                  { text: `${language === 'ar' ? 'الهاتف' : 'Phone'}: ${booking.customer?.phone || (language === 'ar' ? 'غير متوفر' : 'N/A')}`, margin: [0, 0, 0, 5] },
                  { text: `${language === 'ar' ? 'البريد' : 'Email'}: ${booking.customer?.email || (language === 'ar' ? 'غير متوفر' : 'N/A')}`, margin: [0, 0, 0, 5] }
                ],
                background: '#f5f5f5',
                width: '48%',
                margin: [0, 0, 10, 20]
              },
              {
                stack: [
                  { text: language === 'ar' ? 'معلومات القاعة' : 'Venue Information', fontSize: 12, bold: true, color: '#2d2871', margin: [0, 0, 0, 10] },
                  { text: `${language === 'ar' ? 'الاسم' : 'Name'}: ${booking.venue?.nameAr || booking.venue?.name || (language === 'ar' ? 'غير متوفر' : 'N/A')}`, margin: [0, 0, 0, 5] },
                  { text: `${language === 'ar' ? 'الموقع' : 'Location'}: ${booking.venue?.location || booking.locationAddress || (language === 'ar' ? 'غير متوفر' : 'N/A')}`, margin: [0, 0, 0, 5] },
                  { text: `${language === 'ar' ? 'السعة' : 'Capacity'}: ${booking.venue?.capacity || (language === 'ar' ? 'غير متوفر' : 'N/A')} ${language === 'ar' ? 'شخص' : 'persons'}`, margin: [0, 0, 0, 5] }
                ],
                background: '#f5f5f5',
                width: '48%',
                margin: [0, 0, 0, 20]
              }
            ]
          },
          // Booking Details Table
          { text: language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details', fontSize: 12, bold: true, color: '#2d2871', margin: [0, 0, 0, 10] },
          { table: bookingDetailsTable, margin: [0, 0, 0, 20] },
          // Services Table
          ...(booking.services && booking.services.length > 0 ? [
            { text: language === 'ar' ? 'الخدمات الإضافية' : 'Additional Services', fontSize: 12, bold: true, color: '#2d2871', margin: [0, 0, 0, 10] },
            { table: servicesTable, margin: [0, 0, 0, 20] }
          ] : []),
          // Total Section
          {
            stack: [
              { text: `${language === 'ar' ? 'سعر القاعة' : 'Venue Price'}: ${venuePrice.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}`, alignment: language === 'ar' ? 'right' : 'left', margin: [0, 0, 0, 5] },
              ...(servicesTotal > 0 ? [{ text: `${language === 'ar' ? 'الخدمات الإضافية' : 'Additional Services'}: ${servicesTotal.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}`, alignment: language === 'ar' ? 'right' : 'left', margin: [0, 0, 0, 5] }] : []),
              ...(discount > 0 ? [{ text: `${language === 'ar' ? 'الخصم' : 'Discount'}: -${discount.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}`, alignment: language === 'ar' ? 'right' : 'left', margin: [0, 0, 0, 5], color: '#10b981' }] : []),
              { text: `${language === 'ar' ? 'المجموع (بدون ضريبة)' : 'Subtotal (excl. VAT)'}: ${pdfVat.subtotalExVat.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}`, alignment: language === 'ar' ? 'right' : 'left', margin: [0, 0, 0, 5] },
              { text: `${language === 'ar' ? `ضريبة القيمة المضافة (${pdfVat.vatRate}%)` : `VAT (${pdfVat.vatRate}%)`}: ${pdfVat.vatAmount.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}`, alignment: language === 'ar' ? 'right' : 'left', margin: [0, 0, 0, 5] },
              { text: `${language === 'ar' ? 'الإجمالي شامل الضريبة' : 'Total incl. VAT'}: ${pdfVat.totalInclVat.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}`, fontSize: 14, bold: true, color: '#2d2871', alignment: language === 'ar' ? 'right' : 'left', margin: [0, 10, 0, 0] }
            ],
            background: '#f5f5f5',
            margin: [0, 0, 0, 20]
          },
          // Footer
          {
            text: language === 'ar' ? 'شكراً لاستخدامك خدمات فرح' : 'Thank you for using Farah services',
            fontSize: 8,
            alignment: 'center',
            color: '#666',
            margin: [0, 20, 0, 5]
          },
          {
            text: language === 'ar' ? 'للاستفسارات: info@farah.com | +966 5X XXX XXXX' : 'For inquiries: info@farah.com | +966 5X XXX XXXX',
            fontSize: 8,
            alignment: 'center',
            color: '#666'
          }
        ]
      }

      // Generate and download PDF
      const fileName = `invoice-${booking.bookingNumber || booking.id.substring(0, 8)}-${new Date().getTime()}.pdf`
      pdfMake.createPdf(docDefinition).download(fileName)
      toast.success(t('invoiceDownloaded', { ar: 'تم تحميل الفاتورة بنجاح', en: 'Invoice downloaded successfully' }))
    } catch (error) {
      console.error('Error generating PDF:', error)
      const msg = error?.message || String(error)
      toast.error(
        t('errorGeneratingPDF', {
          ar: `خطأ في إنشاء PDF: ${msg}`,
          en: `Error generating PDF: ${msg}`,
        })
      )
    } finally {
      setGenerating(false)
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
      CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
      CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
      COMPLETED: { ar: 'مكتمل', en: 'Completed' }
    }
    return statusMap[status]?.[language] || status
  }

  const getPaymentStatusText = (status) => {
    const statusMap = {
      PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
      PAID: { ar: 'مدفوع', en: 'Paid' },
      FAILED: { ar: 'فاشل', en: 'Failed' },
      REFUNDED: { ar: 'مسترد', en: 'Refunded' }
    }
    return statusMap[status]?.[language] || status
  }

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${booking?.bookingNumber || booking?.id?.substring(0, 8) || 'invoice'}`,
    onBeforePrint: async () => {
      // react-hot-toast has no toast.info()
      toast(t('preparingPrint', { ar: 'جاري إعداد الطباعة...', en: 'Preparing print...' }), {
        icon: 'ℹ️',
        duration: 2000,
      })
    },
    onAfterPrint: () => {
      toast.success(t('printSuccess', { ar: 'تم إرسال الملف للطباعة', en: 'Print sent successfully' }))
    },
    onPrintError: (_loc, err) => {
      console.error('Print error:', err)
      toast.error(t('printFailed', { ar: 'تعذّرت الطباعة', en: 'Print failed' }))
    },
  })

  if (loading) {
    return (
      <AdminPage title={t('invoice', { ar: 'فاتورة الحجز', en: 'Booking Invoice' })}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]"></div>
        </div>
      </AdminPage>
    )
  }

  if (!booking) {
    return (
      <AdminPage title={t('invoice', { ar: 'فاتورة الحجز', en: 'Booking Invoice' })}>
        <div className="text-center py-20">
          <p className="text-gray-500">{t('bookingNotFound', { ar: 'لم يتم العثور على الحجز', en: 'Booking not found' })}</p>
          <button
            onClick={() => navigate('/admin/bookings')}
            className="mt-4 px-6 py-2 bg-[#2d2871] text-white rounded-lg hover:bg-[#1f1a5a] transition-colors"
          >
            {t('backToBookings', { ar: 'العودة للحجوزات', en: 'Back to Bookings' })}
          </button>
        </div>
      </AdminPage>
    )
  }

  const venuePrice = booking.venue?.price || 0
  const servicesTotal = booking.services?.reduce((sum, s) => sum + (s.service?.price || s.price || 0), 0) || 0
  const discount = booking.discount || 0
  const total = booking.finalAmount || (venuePrice + servicesTotal - discount)
  const vat = resolveVatFromRecord(booking, total)

  return (
    <AdminPage title={t('invoice', { ar: 'فاتورة الحجز', en: 'Booking Invoice' })}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="admin-invoice-toolbar print:hidden">
          <button
            type="button"
            onClick={() => navigate(`/admin/bookings/${id}`)}
            className="ads-btn ads-btn-subtle gap-2"
          >
            <ArrowRight className={`h-5 w-5 ${language === 'ar' ? 'rotate-180' : ''}`} aria-hidden />
            <span>{t('back', { ar: 'رجوع', en: 'Back' })}</span>
          </button>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handlePrint} className="ads-btn ads-btn-subtle gap-2">
              <Printer className="h-5 w-5" aria-hidden />
              <span>{t('print', { ar: 'طباعة', en: 'Print' })}</span>
            </button>
            <button
              type="button"
              onClick={generatePDF}
              disabled={generating}
              className="ads-btn ads-btn-primary gap-2"
            >
              <Download className="h-5 w-5" aria-hidden />
              <span>{generating ? t('downloading', { ar: 'جاري التحميل...', en: 'Downloading...' }) : t('downloadPDF', { ar: 'تحميل PDF', en: 'Download PDF' })}</span>
            </button>
          </div>
        </div>

        <div ref={componentRef} className="admin-invoice-sheet invoice-content print:shadow-none print:border-0">
          <div className="admin-invoice-header">
            <div className="admin-invoice-header__brand">
              <h1>Farah</h1>
              <p>{t('eventManagementSystem', { ar: 'نظام إدارة الحفلات والمناسبات', en: 'Event Management System' })}</p>
              <p>{t('countrySaudi', { ar: 'المملكة العربية السعودية', en: 'Saudi Arabia' })}</p>
            </div>
            <div className="admin-invoice-header__meta">
              <h2>{t('bookingInvoice', { ar: 'فاتورة حجز', en: 'Booking Invoice' })}</h2>
              <p className="admin-invoice-header__meta-row">
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {t('invoiceNumber', { ar: 'رقم الفاتورة', en: 'Invoice No' })}:{' '}
                  <strong>{booking.bookingNumber || booking.id.substring(0, 8).toUpperCase()}</strong>
                </span>
              </p>
              <p className="admin-invoice-header__meta-row">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {t('date', { ar: 'التاريخ', en: 'Date' })}:{' '}
                  <strong>{new Date(booking.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="admin-invoice-barcode">
            <Barcode
              value={booking.bookingNumber || booking.id.substring(0, 8).toUpperCase()}
              format="CODE128"
              width={2}
              height={60}
              displayValue
              fontSize={14}
            />
            <p>{t('scanForVerification', { ar: 'امسح هذا الرمز للتحقق من الحجز', en: 'Scan this code for booking verification' })}</p>
          </div>

          <div className="admin-invoice-body">
            <div className="admin-invoice-info-grid">
              <div className="admin-invoice-info-card">
                <h3 className="admin-invoice-info-card__title">
                  <span className="admin-invoice-info-card__icon">
                    <User className="h-5 w-5" aria-hidden />
                  </span>
                  {t('customerInformation', { ar: 'معلومات العميل', en: 'Customer Information' })}
                </h3>
                <p className="admin-invoice-info-line">
                  <span className="admin-invoice-info-line__label">{t('name', { ar: 'الاسم', en: 'Name' })}:</span>
                  <span>{booking.customer?.nameAr || booking.customer?.name || t('notAvailable', { ar: 'غير متوفر', en: 'N/A' })}</span>
                </p>
                <p className="admin-invoice-info-line">
                  <span className="admin-invoice-info-line__label">{t('phone', { ar: 'الهاتف', en: 'Phone' })}:</span>
                  <span dir="ltr">{booking.customer?.phone || t('notAvailable', { ar: 'غير متوفر', en: 'N/A' })}</span>
                </p>
                <p className="admin-invoice-info-line">
                  <span className="admin-invoice-info-line__label">{t('email', { ar: 'البريد', en: 'Email' })}:</span>
                  <span dir="ltr">{booking.customer?.email || t('notAvailable', { ar: 'غير متوفر', en: 'N/A' })}</span>
                </p>
              </div>

              <div className="admin-invoice-info-card">
                <h3 className="admin-invoice-info-card__title">
                  <span className="admin-invoice-info-card__icon">
                    <MapPin className="h-5 w-5" aria-hidden />
                  </span>
                  {t('venueInformation', { ar: 'معلومات القاعة', en: 'Venue Information' })}
                </h3>
                <p className="admin-invoice-info-line">
                  <span className="admin-invoice-info-line__label">{t('name', { ar: 'الاسم', en: 'Name' })}:</span>
                  <span>{booking.venue?.nameAr || booking.venue?.name || t('notAvailable', { ar: 'غير متوفر', en: 'N/A' })}</span>
                </p>
                <p className="admin-invoice-info-line">
                  <span className="admin-invoice-info-line__label">{t('location', { ar: 'الموقع', en: 'Location' })}:</span>
                  <span>{booking.venue?.location || booking.locationAddress || t('notAvailable', { ar: 'غير متوفر', en: 'N/A' })}</span>
                </p>
                {booking.venue?.capacity ? (
                  <p className="admin-invoice-info-line">
                    <span className="admin-invoice-info-line__label">{t('capacity', { ar: 'السعة', en: 'Capacity' })}:</span>
                    <span>{booking.venue.capacity} {t('persons', { ar: 'شخص', en: 'persons' })}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <h3 className="admin-invoice-section-title">
              <Calendar className="h-5 w-5 text-[var(--admin-accent)]" aria-hidden />
              {t('bookingDetails', { ar: 'تفاصيل الحجز', en: 'Booking Details' })}
            </h3>
            <div className="ui-table-wrap mb-8">
              <table className="ui-table admin-invoice-table w-full border-collapse">
                <thead>
                  <tr>
                    <th>{t('information', { ar: 'المعلومة', en: 'Information' })}</th>
                    <th>{t('value', { ar: 'القيمة', en: 'Value' })}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t('bookingDate', { ar: 'تاريخ الحجز', en: 'Booking Date' })}</td>
                    <td>
                      {new Date(booking.date || booking.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('startTime', { ar: 'وقت البدء', en: 'Start Time' })}</td>
                    <td>{booking.startTime || t('notSpecified', { ar: 'غير محدد', en: 'Not specified' })}</td>
                  </tr>
                  <tr>
                    <td>{t('endTime', { ar: 'وقت الانتهاء', en: 'End Time' })}</td>
                    <td>{booking.endTime || t('notSpecified', { ar: 'غير محدد', en: 'Not specified' })}</td>
                  </tr>
                  <tr>
                    <td>{t('status', { ar: 'الحالة', en: 'Status' })}</td>
                    <td>{getStatusText(booking.status)}</td>
                  </tr>
                  <tr>
                    <td>{t('paymentStatus', { ar: 'حالة الدفع', en: 'Payment Status' })}</td>
                    <td>{getPaymentStatusText(booking.paymentStatus)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {booking.services && booking.services.length > 0 ? (
              <>
                <h3 className="admin-invoice-section-title">
                  <DollarSign className="h-5 w-5 text-[var(--admin-accent)]" aria-hidden />
                  {t('additionalServices', { ar: 'الخدمات الإضافية', en: 'Additional Services' })}
                </h3>
                <div className="ui-table-wrap mb-8">
                  <table className="ui-table admin-invoice-table w-full border-collapse">
                    <thead>
                      <tr>
                        <th>{t('service', { ar: 'الخدمة', en: 'Service' })}</th>
                        <th>{t('price', { ar: 'السعر', en: 'Price' })}</th>
                        <th>{t('quantity', { ar: 'الكمية', en: 'Quantity' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.services.map((bookingService) => {
                        const service = bookingService.service || bookingService
                        return (
                          <tr key={service.id || bookingService.id}>
                            <td>{service.nameAr || service.name || t('service', { ar: 'خدمة', en: 'Service' })}</td>
                            <td>{(service.price || 0).toFixed(2)} {t('currency')}</td>
                            <td>1</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            <div className="admin-invoice-total">
              <div className="admin-invoice-total__lines">
                <div className="admin-invoice-total__line">
                  <span>{t('venuePrice', { ar: 'سعر القاعة', en: 'Venue Price' })}</span>
                  <span>{venuePrice.toFixed(2)} {t('currency')}</span>
                </div>
                {servicesTotal > 0 ? (
                  <div className="admin-invoice-total__line">
                    <span>{t('additionalServices', { ar: 'الخدمات الإضافية', en: 'Additional Services' })}</span>
                    <span>{servicesTotal.toFixed(2)} {t('currency')}</span>
                  </div>
                ) : null}
                {discount > 0 ? (
                  <div className="admin-invoice-total__line">
                    <span>{t('discount', { ar: 'الخصم', en: 'Discount' })}</span>
                    <span>-{discount.toFixed(2)} {t('currency')}</span>
                  </div>
                ) : null}
                <div className="admin-invoice-total__line">
                  <span>{t('subtotalExVat', { ar: 'المجموع (بدون ضريبة)', en: 'Subtotal (excl. VAT)' })}</span>
                  <span>{vat.subtotalExVat.toFixed(2)} {t('currency')}</span>
                </div>
                <div className="admin-invoice-total__line">
                  <span>{t('vatAmount', { ar: `ضريبة القيمة المضافة (${vat.vatRate}%)`, en: `VAT (${vat.vatRate}%)` })}</span>
                  <span>{vat.vatAmount.toFixed(2)} {t('currency')}</span>
                </div>
                <div className="admin-invoice-total__line admin-invoice-total__line--grand">
                  <span>{t('totalInclVat', { ar: 'الإجمالي شامل الضريبة', en: 'Total incl. VAT' })}</span>
                  <span>{vat.totalInclVat.toFixed(2)} {t('currency')}</span>
                </div>
              </div>
            </div>

            <div className="admin-invoice-footer">
              <p>{t('thankYouMessage', { ar: 'شكراً لاستخدامك خدمات فرح', en: 'Thank you for using Farah services' })}</p>
              <p>{t('contactInfo', { ar: 'للاستفسارات: info@farah.com | +966 5X XXX XXXX', en: 'For inquiries: info@farah.com | +966 5X XXX XXXX' })}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 12mm; size: A4; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-0 { border: none !important; }
        }
      `}</style>
    </AdminPage>
  )
}

export default Invoice
