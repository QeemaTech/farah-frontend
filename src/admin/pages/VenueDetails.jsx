import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import AdminDetailShell from '../components/AdminDetailShell'
import UiTabs from '../../components/ui/UiTabs'
import { AdminContent, Badge, UiCard, UiStat, UiStats, UiTable } from '../design-system'
import { formatImageSrc } from '../../utils/imageUtils'
import {
  getVenueApiConfig,
  getVenueBookingsApiConfig,
  isFullAdminUser,
  readAdminUser,
} from '../utils/adminSession'
import { Building2, Calendar, Eye, Layers, MapPin, Pencil, Target } from 'lucide-react'

export default function VenueDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const venueApi = useMemo(() => getVenueApiConfig(), [])
  const bookingsApi = useMemo(() => getVenueBookingsApiConfig(), [])
  const readOnly = venueApi.readOnly

  const [venue, setVenue] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [tab, setTab] = useState('overview')

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('venueDetail.tabOverview', { defaultValue: language === 'ar' ? 'نظرة عامة' : 'Overview' }), icon: Layers },
      { id: 'bookings', label: t('nav.bookings'), icon: Calendar },
    ],
    [t, language],
  )

  useEffect(() => {
    fetchVenue()
  }, [id])

  useEffect(() => {
    if (tab === 'bookings' && venue) fetchBookings()
  }, [tab, venue?.id])

  const fetchVenue = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(venueApi.detailUrl(id), { headers: venueApi.headers })
      setVenue(data.venue)
    } catch (err) {
      toast.error(err.response?.data?.error || t('venueDetail.loadFailed', { defaultValue: language === 'ar' ? 'تعذر تحميل القاعة' : 'Could not load venue' }))
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true)
      const { data } = await axios.get(bookingsApi.listUrl, {
        headers: bookingsApi.headers,
        params: {
          limit: 50,
          offset: 0,
          venueId: id,
          ...bookingsApi.listParams,
        },
      })
      setBookings(data.bookings || [])
    } catch {
      toast.error(t('venueDetail.bookingsLoadFailed', { defaultValue: language === 'ar' ? 'تعذر تحميل الحجوزات' : 'Could not load bookings' }))
    } finally {
      setBookingsLoading(false)
    }
  }

  const displayName = venue
    ? language === 'ar'
      ? venue.nameAr || venue.name
      : venue.name || venue.nameAr
    : ''

  const providerName = venue?.provider
    ? language === 'ar'
      ? venue.provider.nameAr || venue.provider.name
      : venue.provider.name || venue.provider.nameAr
    : '—'

  const bookingDetailPath = (bookingId) => {
    if (isFullAdminUser(readAdminUser())) return `/admin/bookings/${bookingId}`
    return `/admin/venue/bookings/${bookingId}`
  }

  return (
    <AdminDetailShell
      title={displayName || t('venueDetail.title', { defaultValue: language === 'ar' ? 'تفاصيل القاعة' : 'Venue details' })}
      subtitle={
        readOnly
          ? t('venueDetail.subtitleAdmin', { defaultValue: language === 'ar' ? 'عرض فقط — إدارة القاعة من مقدم الخدمة' : 'View only — venue is managed by the provider' })
          : t('venueDetail.subtitle', { defaultValue: language === 'ar' ? 'إدارة القاعة وحجوزاتها' : 'Manage venue and bookings' })
      }
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.venues'), path: '/admin/venues' },
        { label: displayName || t('venueDetail.title', { defaultValue: language === 'ar' ? 'تفاصيل القاعة' : 'Venue details' }) },
      ]}
      backTo="/admin/venues"
      backLabel={t('venueDetail.back', { defaultValue: language === 'ar' ? 'العودة للقاعات' : 'Back to venues' })}
      action={
        !readOnly ? (
          <button type="button" className="ads-btn ads-btn-primary gap-2" onClick={() => navigate(`/admin/venues/${id}/edit`)}>
            <Pencil size={18} aria-hidden />
            {t('common.edit')}
          </button>
        ) : null
      }
      loading={loading}
      empty={!loading && !venue}
      emptyTitle={t('venueDetail.notFound', { defaultValue: language === 'ar' ? 'القاعة غير موجودة' : 'Venue not found' })}
      noCard
    >
      {venue ? (
        <AdminContent className="gap-6">
          <div className="admin-entity-hero">
            <div className="admin-entity-hero__visual">
              {venue.images?.length ? (
                <img src={formatImageSrc(venue.images[0])} alt="" className="admin-entity-hero__img" />
              ) : (
                <div className="admin-entity-hero__placeholder">
                  <Building2 className="h-12 w-12" aria-hidden />
                </div>
              )}
            </div>
            <div className="admin-entity-hero__body">
              <div className="flex flex-wrap items-center gap-2">
                <h2>{displayName}</h2>
                <Badge variant={venue.isActive ? 'success' : 'danger'}>
                  {venue.isActive ? t('users.active') : t('users.inactive')}
                </Badge>
              </div>
              <p className="admin-entity-hero__muted flex items-center gap-1">
                <MapPin size={14} aria-hidden />
                {venue.location || '—'}
              </p>
              <UiStats>
                <UiStat icon={Target} iconTone="indigo" value={venue._count?.bookings ?? 0} label={t('nav.bookings')} />
                <UiStat
                  icon={Building2}
                  iconTone="emerald"
                  value={(Number(venue.price) || 0).toFixed(0)}
                  label={t('dashboard.currency')}
                />
              </UiStats>
            </div>
          </div>

          <UiTabs tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'overview' && (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">
                {t('venueDetail.basicInfo', { defaultValue: language === 'ar' ? 'المعلومات الأساسية' : 'Basic information' })}
              </h3>
              <ul className="admin-field-list">
                <li className="admin-field-list__item">
                  <span className="admin-field-list__label">{t('venueDetail.nameAr', { defaultValue: language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)' })}</span>
                  <span className="admin-field-list__value" dir="rtl">{venue.nameAr || '—'}</span>
                </li>
                <li className="admin-field-list__item">
                  <span className="admin-field-list__label">{t('venueDetail.nameEn', { defaultValue: language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)' })}</span>
                  <span className="admin-field-list__value" dir="ltr">{venue.name || '—'}</span>
                </li>
                <li className="admin-field-list__item">
                  <span className="admin-field-list__label">{t('roles.provider')}</span>
                  <span className="admin-field-list__value">{providerName}</span>
                </li>
                <li className="admin-field-list__item">
                  <span className="admin-field-list__label">{t('venueDetail.capacity', { defaultValue: language === 'ar' ? 'السعة' : 'Capacity' })}</span>
                  <span className="admin-field-list__value">{venue.capacity ?? '—'}</span>
                </li>
                <li className="admin-field-list__item">
                  <span className="admin-field-list__label">{t('venueDetail.description', { defaultValue: language === 'ar' ? 'الوصف' : 'Description' })}</span>
                  <span className="admin-field-list__value">{venue.description?.trim() || venue.descriptionAr?.trim() || '—'}</span>
                </li>
              </ul>
            </UiCard>
          )}

          {tab === 'bookings' && (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">
                {t('venueDetail.bookingsTitle', { defaultValue: language === 'ar' ? 'حجوزات القاعة' : 'Venue bookings' })}
              </h3>
              {bookingsLoading ? (
                <p className="py-10 text-center text-[var(--admin-text-muted)]">{t('common.loading', { defaultValue: language === 'ar' ? 'جاري التحميل…' : 'Loading…' })}</p>
              ) : bookings.length === 0 ? (
                <p className="py-10 text-center text-[var(--admin-text-muted)]">
                  {t('venueDetail.noBookings', { defaultValue: language === 'ar' ? 'لا توجد حجوزات بعد' : 'No bookings yet' })}
                </p>
              ) : (
                <UiTable tableClassName="ui-table--venues" minWidth={900}>
                  <thead>
                    <tr>
                      <th>{t('bookingNumber', { defaultValue: language === 'ar' ? 'رقم الحجز' : 'Booking #' })}</th>
                      <th>{t('customer', { defaultValue: language === 'ar' ? 'العميل' : 'Customer' })}</th>
                      <th>{t('date', { defaultValue: language === 'ar' ? 'التاريخ' : 'Date' })}</th>
                      <th>{t('amount', { defaultValue: language === 'ar' ? 'المبلغ' : 'Amount' })}</th>
                      <th>{t('common.status')}</th>
                      <th className="text-end">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => {
                      const customerName = language === 'ar'
                        ? b.customer?.nameAr || b.customer?.name
                        : b.customer?.name || b.customer?.nameAr
                      return (
                        <tr
                          key={b.id}
                          className="ui-table-row--clickable"
                          onClick={() => navigate(bookingDetailPath(b.id))}
                        >
                          <td><span className="ui-table-booking-ref">{b.bookingNumber || b.id.slice(0, 8)}</span></td>
                          <td>{customerName || '—'}</td>
                          <td className="ui-table-cell--nowrap">{b.date ? new Date(b.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB') : '—'}</td>
                          <td>
                            <span className="tabular-nums">{(Number(b.finalAmount ?? b.totalAmount) || 0).toFixed(2)}</span>
                            <span className="text-[var(--admin-text-muted)]"> {t('dashboard.currency')}</span>
                          </td>
                          <td className="ui-table-cell--nowrap">
                            <Badge variant={b.status === 'COMPLETED' ? 'success' : b.status === 'CANCELLED' ? 'danger' : 'warning'} className="ui-badge--nowrap">
                              {b.status}
                            </Badge>
                          </td>
                          <td className="ui-table-cell--nowrap">
                            <div className="ui-actions" onClick={(e) => e.stopPropagation()}>
                              <Link to={bookingDetailPath(b.id)} className="ui-action-btn inline-flex">
                                <Eye size={16} aria-hidden />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </UiTable>
              )}
            </UiCard>
          )}
        </AdminContent>
      ) : null}
    </AdminDetailShell>
  )
}
