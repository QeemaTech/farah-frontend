import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  MapPin,
  RefreshCw,
  Store,
  Building2,
  Navigation,
  List,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import AdminPage from '../components/AdminPage'
import { API_URL, adminAuthHeaders } from '../utils/adminSession'
import {
  AdminContent,
  Badge,
  EmptyState,
  UiCard,
  UiStat,
  UiStats,
  UiChipGroup,
  UiChip,
} from '../design-system'
import 'leaflet/dist/leaflet.css'

const VENDOR_TYPES = {
  RESTAURANT: { ar: 'مطعم', en: 'Restaurant' },
  FASHION_STORE: { ar: 'متجر أزياء', en: 'Fashion Store' },
  SWEETS_SHOP: { ar: 'حلويات', en: 'Sweets Shop' },
  HEADPHONES_RENTAL: { ar: 'تأجير سماعات', en: 'Headphones Rental' },
  SLAUGHTER_PROVIDER: { ar: 'ذبائح', en: 'Slaughter' },
  VENUE_PROVIDER: { ar: 'قاعات', en: 'Venues' },
}

const MARKER_COLORS = {
  RESTAURANT: '#f59e0b',
  FASHION_STORE: '#8b5cf6',
  SWEETS_SHOP: '#ec4899',
  HEADPHONES_RENTAL: '#06b6d4',
  SLAUGHTER_PROVIDER: '#ef4444',
  VENUE_PROVIDER: '#6366f1',
  default: '#64748b',
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function markerIcon(vendorType, selected) {
  const color = MARKER_COLORS[vendorType] || MARKER_COLORS.default
  const size = selected ? 36 : 28
  return L.divIcon({
    className: 'vendors-map-marker',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);background:${color};
      border:3px solid ${selected ? '#fff' : 'rgba(255,255,255,0.9)'};
      box-shadow:0 4px 12px rgba(0,0,0,0.25);
    "><span style="transform:rotate(45deg);width:8px;height:8px;background:#fff;border-radius:50%;"></span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points?.length) return
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
  }, [map, points])
  return null
}

function pointKey(p) {
  return `${p.vendorId}-${p.type}-${p.locationId || p.venueId || 'main'}-${p.latitude}-${p.longitude}`
}

export default function VendorsMap() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'

  const [allPoints, setAllPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [selectedKey, setSelectedKey] = useState(null)

  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/admin/vendors-map`, {
        headers: adminAuthHeaders(),
        params: { activeOnly: activeOnly ? 'true' : undefined },
      })
      setAllPoints(res.data.vendors || [])
    } catch (e) {
      console.error('vendors-map:', e)
      toast.error(t('vendorsMap.loadFailed'))
      setAllPoints([])
    } finally {
      setLoading(false)
    }
  }, [activeOnly, t])

  useEffect(() => {
    fetchPoints()
  }, [fetchPoints])

  const cities = useMemo(() => {
    const set = new Set()
    allPoints.forEach((p) => {
      if (p.city) set.add(p.city)
    })
    return [...set].sort((a, b) => a.localeCompare(b, rtl ? 'ar' : 'en'))
  }, [allPoints, rtl])

  const points = useMemo(() => {
    return allPoints.filter((p) => {
      if (filterType && p.vendorType !== filterType) return false
      if (filterCity && (p.city || '') !== filterCity) return false
      return true
    })
  }, [allPoints, filterType, filterCity])

  const selected = useMemo(
    () => points.find((p) => pointKey(p) === selectedKey) || null,
    [points, selectedKey],
  )

  const activeCount = useMemo(() => points.filter((p) => p.isActive).length, [points])

  const typeLabel = (type) => {
    const entry = VENDOR_TYPES[type]
    if (!entry) return type || '—'
    return rtl ? entry.ar : entry.en
  }

  const locationTypeLabel = (type) => {
    if (type === 'branch') return t('vendorsMap.branch')
    if (type === 'venue') return t('vendorsMap.venue')
    return t('vendorsMap.main')
  }

  const displayName = (p) =>
    rtl
      ? p.businessNameAr || p.businessName || p.locationNameAr || p.locationName || p.name
      : p.businessName || p.businessNameAr || p.locationName || p.locationNameAr || p.name

  const defaultCenter = [24.7136, 46.6753]

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={() => navigate('/admin/vendors')}>
        <ArrowLeft className={`h-4 w-4 ${rtl ? 'rotate-180' : ''}`} />
        {t('vendorsMap.backToList')}
      </button>
      <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={fetchPoints} disabled={loading}>
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {t('vendorsMap.refresh')}
      </button>
    </div>
  )

  const toolbar = (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <UiChipGroup ariaLabel={t('vendorsMap.filterType')}>
        <UiChip active={!filterType} onClick={() => setFilterType('')}>
          {t('vendorsMap.allTypes')}
        </UiChip>
        {Object.keys(VENDOR_TYPES).map((k) => (
          <UiChip key={k} active={filterType === k} onClick={() => setFilterType(k)}>
            {typeLabel(k)}
          </UiChip>
        ))}
      </UiChipGroup>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="admin-input min-w-[140px]"
          aria-label={t('vendorsMap.filterCity')}
        >
          <option value="">{t('vendorsMap.allCities')}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--admin-text-muted)]">
          <input
            type="checkbox"
            className="rounded border-[var(--admin-border)]"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          {t('vendorsMap.activeOnly')}
        </label>
      </div>
    </div>
  )

  return (
    <AdminPage
      title={t('vendorsMap.title')}
      subtitle={t('vendorsMap.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.vendors'), path: '/admin/vendors' },
        { label: t('vendorsMap.title') },
      ]}
      action={headerActions}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={MapPin} iconTone="indigo" value={points.length} label={t('vendorsMap.onMap')} />
          <UiStat icon={Store} iconTone="emerald" value={activeCount} label={t('vendorsMap.activeOnly')} />
          <UiStat icon={Building2} iconTone="amber" value={cities.length} label={t('vendorsMap.cities')} />
        </UiStats>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <UiCard toolbar={toolbar} className="overflow-hidden [&_.ui-card__toolbar]:border-b-0">
            <div className="relative min-h-[520px] bg-[var(--admin-bg)]">
              {loading ? (
                <div className="flex min-h-[520px] items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]" />
                </div>
              ) : points.length === 0 ? (
                <div className="flex min-h-[520px] items-center justify-center p-6">
                  <EmptyState title={t('vendorsMap.empty')} description={t('vendorsMap.emptyHint')} />
                </div>
              ) : (
                <MapContainer
                  center={defaultCenter}
                  zoom={8}
                  className="z-0 h-[520px] w-full"
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds points={points} />
                  {points.map((p) => {
                    const key = pointKey(p)
                    const isSelected = selectedKey === key
                    return (
                      <Marker
                        key={key}
                        position={[p.latitude, p.longitude]}
                        icon={markerIcon(p.vendorType, isSelected)}
                        eventHandlers={{
                          click: () => setSelectedKey(key),
                        }}
                      >
                        <Popup>
                          <div className={`min-w-[200px] ${rtl ? 'text-right' : 'text-left'}`}>
                            <div className="font-semibold text-gray-900">{displayName(p)}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              {typeLabel(p.vendorType)} · {locationTypeLabel(p.type)}
                            </div>
                            {p.phone ? <div className="mt-1 text-sm text-gray-700">{p.phone}</div> : null}
                            {(p.address || p.city) && (
                              <div className="mt-1 text-sm text-gray-600">
                                {[p.address, p.city, p.area].filter(Boolean).join(', ')}
                              </div>
                            )}
                            {!p.isActive ? (
                              <Badge variant="warning" className="mt-2">
                                {t('vendorsMap.inactive')}
                              </Badge>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/vendors/${p.vendorId}`)}
                              className="mt-3 w-full rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                            >
                              {t('vendorsMap.openProfile')}
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              )}
            </div>
          </UiCard>

          <UiCard className="max-h-[600px] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)]">
              <List className="h-4 w-4 text-[var(--admin-accent)]" />
              {t('vendorsMap.locations')} ({points.length})
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {loading ? (
                <p className="p-4 text-center text-sm text-[var(--admin-text-muted)]">{t('slaughterOrders.loading')}</p>
              ) : points.length === 0 ? (
                <p className="p-4 text-center text-sm text-[var(--admin-text-muted)]">{t('vendorsMap.empty')}</p>
              ) : (
                <ul className="divide-y divide-[var(--admin-border)]">
                  {points.map((p) => {
                    const key = pointKey(p)
                    const isSelected = selectedKey === key
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => setSelectedKey(key)}
                          className={`w-full px-4 py-3 text-start transition-colors hover:bg-[var(--admin-bg)] ${
                            isSelected ? 'bg-[var(--admin-accent-subtle)]' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-[var(--admin-text)]">{displayName(p)}</p>
                              <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
                                {typeLabel(p.vendorType)} · {locationTypeLabel(p.type)}
                              </p>
                              {p.city ? (
                                <p className="mt-1 flex items-center gap-1 text-xs text-[var(--admin-text-muted)]">
                                  <Navigation className="h-3 w-3 shrink-0" />
                                  {p.city}
                                </p>
                              ) : null}
                            </div>
                            {!p.isActive ? <Badge variant="warning">{t('vendorsMap.inactive')}</Badge> : null}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </UiCard>
        </div>

        {selected ? (
          <div className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--admin-shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--admin-text)]">{displayName(selected)}</h3>
                <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
                  {typeLabel(selected.vendorType)} · {locationTypeLabel(selected.type)}
                </p>
              </div>
              <button
                type="button"
                className="ads-btn ads-btn-primary gap-2"
                onClick={() => navigate(`/admin/vendors/${selected.vendorId}`)}
              >
                <ExternalLink className="h-4 w-4" />
                {t('vendorsMap.openProfile')}
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {selected.phone ? (
                <div>
                  <dt className="text-[var(--admin-text-muted)]">{rtl ? 'الهاتف' : 'Phone'}</dt>
                  <dd className="font-medium">{selected.phone}</dd>
                </div>
              ) : null}
              {selected.city ? (
                <div>
                  <dt className="text-[var(--admin-text-muted)]">{t('vendorsMap.filterCity')}</dt>
                  <dd className="font-medium">{selected.city}</dd>
                </div>
              ) : null}
              {selected.address ? (
                <div className="sm:col-span-2">
                  <dt className="text-[var(--admin-text-muted)]">{rtl ? 'العنوان' : 'Address'}</dt>
                  <dd className="font-medium">{selected.address}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[var(--admin-text-muted)]">{rtl ? 'الإحداثيات' : 'Coordinates'}</dt>
                <dd className="font-mono text-xs">
                  {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                </dd>
              </div>
            </dl>
            {selected.services?.length > 0 ? (
              <p className="mt-3 text-xs text-[var(--admin-text-muted)]">
                {t('vendorsMap.services')}:{' '}
                {selected.services
                  .slice(0, 4)
                  .map((s) => (rtl ? s.nameAr || s.name : s.name))
                  .join(', ')}
              </p>
            ) : null}
          </div>
        ) : points.length > 0 && !loading ? (
          <p className="text-center text-sm text-[var(--admin-text-muted)]">{t('vendorsMap.selectHint')}</p>
        ) : null}
      </AdminContent>
    </AdminPage>
  )
}
