import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import AdminDetailShell from '../components/AdminDetailShell'
import MapPreview from '../components/MapPreview'
import UiTabs from '../../components/ui/UiTabs'
import {
  AdminContent,
  Badge,
  UiCard,
  UiStats,
  UiStat,
  UiTable,
} from '../design-system'
import { formatImageSrc, parseImagesArray } from '../../utils/imageUtils'
import { API_URL, getMobileVendorApiBase, usesProviderApis, parseAdminBoolean } from '../utils/adminSession'
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Power,
  Star,
  Target,
  User,
  CircleCheck,
} from 'lucide-react'

function serviceTypeLabel(type, language) {
  const map = {
    VENUE: { ar: 'قاعة', en: 'Venue' },
    FOOD_PROVIDER: { ar: 'مقدم طعام', en: 'Food Provider' },
    PHOTOGRAPHER: { ar: 'مصور', en: 'Photographer' },
    CAR: { ar: 'سيارة', en: 'Car' },
    DECORATION: { ar: 'ديكور', en: 'Decoration' },
    DJ: { ar: 'دي جي', en: 'DJ' },
    FLORIST: { ar: 'بائع زهور', en: 'Florist' },
    OTHER: { ar: 'أخرى', en: 'Other' },
  }
  const entry = map[type] || map.OTHER
  return language === 'ar' ? entry.ar : entry.en
}

function parseImages(images) {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function DetailRow({ label, value, dir }) {
  return (
    <div className="admin-detail-row">
      <dt className="admin-detail-row__label">{label}</dt>
      <dd className="admin-detail-row__value" dir={dir}>
        {value ?? '—'}
      </dd>
    </div>
  )
}

export default function ServiceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const rtl = language === 'ar'

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [imageIndex, setImageIndex] = useState(0)

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('serviceDetail.tabOverview'), icon: Target },
      { id: 'location', label: t('serviceDetail.tabLocation'), icon: MapPin },
      { id: 'venues', label: t('serviceDetail.tabVenues'), icon: Building2 },
      { id: 'bookings', label: t('serviceDetail.tabBookings'), icon: Calendar },
      { id: 'reviews', label: t('serviceDetail.tabReviews'), icon: Star },
      { id: 'holidays', label: t('serviceDetail.tabHolidays'), icon: Clock },
    ],
    [t],
  )

  useEffect(() => {
    setImageIndex(0)
    fetchService()
  }, [id])

  const fetchService = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const base = usesProviderApis() ? `${getMobileVendorApiBase()}/services` : `${API_URL}/admin/services`
      const { data } = await axios.get(`${base}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setService(data.service)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || t('serviceDetail.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async () => {
    if (usesProviderApis() || !service) return
    const currentlyActive = parseAdminBoolean(service.isActive)
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${API_URL}/admin/services/${id}/status`,
        { isActive: !currentlyActive },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(t('serviceDetail.statusUpdated'))
      fetchService()
    } catch (err) {
      toast.error(err.response?.data?.error || t('updateFailed'))
    }
  }

  const isServiceActive = service ? parseAdminBoolean(service.isActive) : false

  const images = service ? parseImages(service.images) : []
  const displayName = service
    ? language === 'ar'
      ? service.nameAr || service.name
      : service.name || service.nameAr
    : ''

  const headerActions = service ? (
    <>
      {!usesProviderApis() ? (
        <>
          <button type="button" onClick={() => navigate(`/admin/services/${id}/edit`)} className="ads-btn ads-btn-subtle gap-2">
            <Pencil size={18} aria-hidden />
            {t('edit')}
          </button>
          <button type="button" onClick={toggleStatus} className="ads-btn ads-btn-subtle gap-2">
            {isServiceActive ? <Power size={18} aria-hidden /> : <CircleCheck size={18} aria-hidden />}
            {isServiceActive ? t('deactivate') : t('activate')}
          </button>
        </>
      ) : null}
    </>
  ) : null

  return (
    <AdminDetailShell
      title={displayName || t('serviceDetail.title')}
      subtitle={service ? serviceTypeLabel(service.serviceType, language) : ''}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('services'), path: '/admin/services' },
        { label: displayName || t('serviceDetail.title') },
      ]}
      backTo="/admin/services"
      backLabel={t('serviceDetail.backToList')}
      action={headerActions}
      loading={loading}
      empty={!loading && !service}
      emptyTitle={t('serviceDetail.notFound')}
      emptyDescription={t('serviceDetail.notFoundHint')}
      noCard
    >
      {service ? (
        <AdminContent className="gap-6">
          <div className="admin-service-hero">
            <div className="admin-service-hero__gallery">
              {images.length > 0 ? (
                <>
                  <img
                    src={formatImageSrc(images[imageIndex])}
                    alt={displayName}
                    className="admin-service-hero__main-img"
                  />
                  {images.length > 1 ? (
                    <div className="admin-service-hero__thumbs">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`admin-service-hero__thumb ${idx === imageIndex ? 'is-active' : ''}`}
                          onClick={() => setImageIndex(idx)}
                        >
                          <img src={formatImageSrc(img)} alt="" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="admin-service-hero__placeholder">
                  <ImageIcon className="h-12 w-12" aria-hidden />
                </div>
              )}
            </div>
            <div className="admin-service-hero__meta">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isServiceActive ? 'success' : 'danger'}>
                  {isServiceActive ? t('active') : t('inactive')}
                </Badge>
                <Badge variant="info">{serviceTypeLabel(service.serviceType, language)}</Badge>
                {service.category ? (
                  <Badge variant="default">
                    {language === 'ar'
                      ? service.category.nameAr || service.category.name
                      : service.category.name || service.category.nameAr}
                  </Badge>
                ) : null}
              </div>
              <h2 className="admin-service-hero__title">{displayName}</h2>
              <p className="admin-service-hero__location">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {service.location || service.address || t('serviceDetail.noLocation')}
              </p>
              <UiStats className="admin-service-hero__stats">
                <UiStat
                  icon={DollarSign}
                  iconTone="emerald"
                  value={`${(service.price ?? 0).toFixed(2)} ${t('currency')}`}
                  label={t('price')}
                />
                <UiStat
                  icon={Star}
                  iconTone="amber"
                  value={`${(service.rating ?? 0).toFixed(1)} (${service.reviewCount ?? 0})`}
                  label={t('rating')}
                />
                <UiStat
                  icon={Calendar}
                  iconTone="indigo"
                  value={service._count?.bookings ?? 0}
                  label={t('bookings')}
                />
                <UiStat
                  icon={Building2}
                  iconTone="indigo"
                  value={service._count?.venues ?? 0}
                  label={t('serviceDetail.linkedVenues')}
                />
              </UiStats>
            </div>
          </div>

          <UiTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            <div className="admin-service-panels">
              <UiCard>
                <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.descriptions')}</h3>
                <dl className="admin-detail-grid">
                  <DetailRow label={t('name') + ' (EN)'} value={service.name} dir="ltr" />
                  <DetailRow label={t('name') + ' (AR)'} value={service.nameAr} dir="rtl" />
                </dl>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
                      {t('description')} (EN)
                    </p>
                    <p className="text-sm text-[var(--admin-text)]" dir="ltr">
                      {service.description || '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
                      {t('description')} (AR)
                    </p>
                    <p className="text-sm text-[var(--admin-text)]" dir="rtl">
                      {service.descriptionAr || '—'}
                    </p>
                  </div>
                </div>
              </UiCard>

              <UiCard>
                <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.pricing')}</h3>
                <dl className="admin-detail-grid">
                  <DetailRow label={t('price')} value={`${(service.price ?? 0).toFixed(2)} ${t('currency')}`} />
                  <DetailRow
                    label={t('pricePerHour')}
                    value={
                      service.pricePerHour != null
                        ? `${service.pricePerHour.toFixed(2)} ${t('currency')}`
                        : '—'
                    }
                  />
                  <DetailRow label={t('commission')} value={`${service.commission ?? 0}%`} />
                </dl>
              </UiCard>

              <UiCard>
                <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('provider')}</h3>
                {service.provider ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-accent-subtle)] text-[var(--admin-accent)]">
                      <User className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--admin-text)]">
                        {language === 'ar'
                          ? service.provider.nameAr || service.provider.name
                          : service.provider.name || service.provider.nameAr}
                      </p>
                      <p className="text-sm text-[var(--admin-text-muted)]" dir="ltr">
                        {service.provider.phone || service.provider.email || '—'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--admin-text-muted)]">—</p>
                )}
              </UiCard>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="admin-service-panels">
              <UiCard>
                <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.locationInfo')}</h3>
                <dl className="admin-detail-grid">
                  <DetailRow label={t('location')} value={service.location} />
                  <DetailRow label={t('address')} value={service.address} />
                  <DetailRow label={t('latitude')} value={service.latitude} dir="ltr" />
                  <DetailRow label={t('longitude')} value={service.longitude} dir="ltr" />
                  <DetailRow
                    label={t('workingHoursStart')}
                    value={
                      service.workingHoursStart && service.workingHoursEnd
                        ? `${service.workingHoursStart} – ${service.workingHoursEnd}`
                        : '—'
                    }
                  />
                </dl>
              </UiCard>

              <UiCard>
                <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.capabilities')}</h3>
                <div className="flex flex-wrap gap-2">
                  {service.worksInVenues ? (
                    <Badge variant="success">
                      {t('worksInVenues', { ar: 'يعمل داخل القاعات', en: 'Works inside venues' })}
                    </Badge>
                  ) : null}
                  {service.worksExternal ? (
                    <Badge variant="info">
                      {t('worksExternal', { ar: 'يعمل خارج القاعات', en: 'Works externally' })}
                    </Badge>
                  ) : null}
                  {service.requiresVenue ? (
                    <Badge variant="warning">
                      {t('requiresVenue', { ar: 'يتطلب قاعة', en: 'Requires venue' })}
                    </Badge>
                  ) : null}
                  {!service.worksInVenues && !service.worksExternal && !service.requiresVenue ? (
                    <span className="text-sm text-[var(--admin-text-muted)]">—</span>
                  ) : null}
                </div>
              </UiCard>

              {service.latitude != null && service.longitude != null ? (
                <UiCard>
                  <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.map')}</h3>
                  <MapPreview latitude={service.latitude} longitude={service.longitude} height={280} />
                </UiCard>
              ) : null}
            </div>
          )}

          {activeTab === 'venues' && (
            <UiCard>
              <h3 className="text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.linkedVenues')}</h3>
              <p className="mb-4 text-sm text-[var(--admin-text-muted)]">{t('serviceDetail.venuesSubtitle')}</p>
              {(service.venues || []).length === 0 ? (
                <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('serviceDetail.noVenues')}</p>
              ) : (
                <UiTable minWidth={640}>
                  <thead>
                    <tr>
                      <th>{t('name')}</th>
                      <th>{t('location')}</th>
                      <th>{t('price')}</th>
                      <th>{t('status')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(service.venues || []).map((vs) => {
                      const v = vs.venue
                      if (!v) return null
                      const vName = language === 'ar' ? v.nameAr || v.name : v.name || v.nameAr
                      return (
                        <tr key={vs.id}>
                          <td className="font-medium">{vName}</td>
                          <td className="text-[var(--admin-text-muted)]">{v.location || '—'}</td>
                          <td>
                            {(v.price ?? 0).toFixed(2)} {t('currency')}
                          </td>
                          <td>
                            <Badge variant={v.isActive ? 'success' : 'danger'}>
                              {v.isActive ? t('active') : t('inactive')}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Link to={`/admin/venues/${v.id}/edit`} className="ui-action-btn inline-flex">
                              <Eye size={16} aria-hidden />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </UiTable>
              )}
            </UiCard>
          )}

          {activeTab === 'bookings' && (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.recentBookings')}</h3>
              {(service.bookings || []).length === 0 ? (
                <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('serviceDetail.noBookings')}</p>
              ) : (
                <UiTable minWidth={720}>
                  <thead>
                    <tr>
                      <th>{t('date')}</th>
                      <th>{t('customer')}</th>
                      <th>{t('venue')}</th>
                      <th>{t('status')}</th>
                      <th>{t('price')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(service.bookings || []).map((bs) => {
                      const b = bs.booking
                      if (!b) return null
                      const customerName =
                        language === 'ar'
                          ? b.customer?.nameAr || b.customer?.name
                          : b.customer?.name || b.customer?.nameAr
                      return (
                        <tr key={bs.id}>
                          <td>{b.date ? new Date(b.date).toLocaleDateString(rtl ? 'ar-SA' : 'en-GB') : '—'}</td>
                          <td>{customerName || '—'}</td>
                          <td className="text-[var(--admin-text-muted)]">
                            {b.venue
                              ? language === 'ar'
                                ? b.venue.nameAr || b.venue.name
                                : b.venue.name || b.venue.nameAr
                              : '—'}
                          </td>
                          <td>
                            <Badge variant="default">{b.status}</Badge>
                          </td>
                          <td>
                            {(b.finalAmount ?? b.totalAmount ?? 0).toFixed(2)} {t('currency')}
                          </td>
                          <td className="text-end">
                            <Link to={`/admin/bookings/${b.id}`} className="ui-action-btn inline-flex">
                              <Eye size={16} aria-hidden />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </UiTable>
              )}
            </UiCard>
          )}

          {activeTab === 'reviews' && (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.reviews')}</h3>
              {(service.reviews || []).length === 0 ? (
                <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('serviceDetail.noReviews')}</p>
              ) : (
                <ul className="divide-y divide-[var(--admin-border)]">
                  {(service.reviews || []).map((review) => {
                    const userName =
                      language === 'ar'
                        ? review.user?.nameAr || review.user?.name
                        : review.user?.name || review.user?.nameAr
                    return (
                      <li key={review.id} className="flex gap-4 py-4 first:pt-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent-subtle)] text-[var(--admin-accent)]">
                          <User className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-[var(--admin-text)]">{userName || '—'}</p>
                            <span className="text-amber-500">
                              {'★'.repeat(Math.min(5, review.rating || 0))}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--admin-text)]">
                            {language === 'ar' ? review.commentAr || review.comment : review.comment || review.commentAr}
                          </p>
                          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                            {new Date(review.createdAt).toLocaleString(rtl ? 'ar-SA' : 'en-GB')}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </UiCard>
          )}

          {activeTab === 'holidays' && (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('serviceDetail.holidays')}</h3>
              {(service.holidays || []).length === 0 ? (
                <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('serviceDetail.noHolidays')}</p>
              ) : (
                <UiTable minWidth={480}>
                  <thead>
                    <tr>
                      <th>{t('date')}</th>
                      <th>{t('serviceDetail.reason')}</th>
                      <th>{t('serviceDetail.recurring')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(service.holidays || []).map((h) => (
                      <tr key={h.id}>
                        <td>{new Date(h.date).toLocaleDateString(rtl ? 'ar-SA' : 'en-GB')}</td>
                        <td>{h.reason || '—'}</td>
                        <td>
                          <Badge variant={h.isRecurring ? 'info' : 'default'}>
                            {h.isRecurring ? t('slaughter.yes') : t('slaughter.no')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
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
