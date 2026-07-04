import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatImageSrc } from '../../utils/imageUtils'
import { Plus, FileBarChart, CalendarDays, Settings, Pencil, Power, Trash2, CircleCheck, Building2, CheckCircle, Eye } from 'lucide-react'
import { API_URL, getVenueApiConfig, hasPermission, readAdminUser, usesProviderApis } from '../utils/adminSession'
import {
  AdminContent,
  Badge,
  SearchInput,
  UiCard,
  UiStats,
  UiStat,
  UiChipGroup,
  UiChip,
  UiTable,
  UiTableSkeleton,
} from '../design-system'

function Venues() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const venueApi = getVenueApiConfig()
  const readOnly = venueApi.readOnly
  const user = readAdminUser()
  const canCreate = hasPermission(user, 'venues', 'create')
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 20,
    totalPages: 0
  })
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [showGallery, setShowGallery] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    fetchVenues()
  }, [search, filterActive, pagination.currentPage])

  const fetchVenues = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      const providerMode = usesProviderApis()
      const url = venueApi.listUrl
      const response = await axios.get(url, {
        headers: venueApi.headers,
        params: {
          search: search || undefined,
          isActive: filterActive || undefined,
          limit: pagination.limit,
          offset,
        },
      })
      setVenues(response.data.venues || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit),
      }))
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const toggleStatus = async (e, id, isActive) => {
    e.preventDefault()
    e.stopPropagation()
    if (readOnly) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(venueApi.statusUrl(id),
        { isActive: !isActive },
        { headers: venueApi.headers }
      )
      fetchVenues()
    } catch (error) {
      console.error('Error updating venue status:', error)
      toast.error(error.response?.data?.error || t('updateFailed'))
    }
  }

  const deleteVenue = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (readOnly) return
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(venueApi.deleteUrl(id), {
        headers: venueApi.headers
      })
      fetchVenues()
    } catch (error) {
      console.error('Error deleting venue:', error)
      toast.error(error.response?.data?.error || t('deleteFailed'))
    }
  }

  const activeCount = venues.filter((v) => v.isActive).length

  const headerActions = canCreate && !readOnly ? (
    <>
      <button type="button" onClick={() => navigate('/admin/venues/add')} className="ads-btn ads-btn-primary gap-2">
        <Plus size={18} aria-hidden />
        {t('addVenue', { ar: 'إضافة قاعة', en: 'Add venue' })}
      </button>
      {!usesProviderApis() ? (
        <button type="button" onClick={() => navigate('/admin/reports?generate=venues')} className="ads-btn ads-btn-subtle gap-2">
          <FileBarChart size={18} aria-hidden />
          {t('report')}
        </button>
      ) : null}
    </>
  ) : !readOnly ? (
    <button type="button" onClick={() => navigate('/admin/reports?generate=venues')} className="ads-btn ads-btn-subtle gap-2">
      <FileBarChart size={18} aria-hidden />
      {t('report')}
    </button>
  ) : null

  const toolbar = (
    <>
      <div className="ui-search ui-search--compact">
        <SearchInput
          placeholder={t('searchVenues', { ar: 'ابحث في القاعات...', en: 'Search venues...' })}
          onDebouncedChange={(v) => {
            setSearch(v)
            setPagination((prev) => ({ ...prev, currentPage: 1 }))
          }}
        />
      </div>
      <UiChipGroup className="ui-card__toolbar-chips" ariaLabel={t('status')}>
        {[
          { value: '', label: t('allVenues', { ar: 'الكل', en: 'All' }) },
          { value: 'true', label: t('active') },
          { value: 'false', label: t('inactive') },
        ].map((c) => (
          <UiChip
            key={c.value || 'all'}
            active={filterActive === c.value}
            onClick={() => {
              setFilterActive(c.value)
              setPagination((prev) => ({ ...prev, currentPage: 1 }))
            }}
          >
            {c.label}
          </UiChip>
        ))}
      </UiChipGroup>
    </>
  )

  return (
    <AdminPage
      title={t('venues', { ar: 'القاعات', en: 'Venues' })}
      subtitle={language === 'ar' ? 'إدارة القاعات والأسعار والحجوزات' : 'Manage venues, pricing, and bookings'}
      breadcrumbs={[
        { label: t('nav.dashboard', { ar: 'الرئيسية', en: 'Home' }), path: '/admin/dashboard' },
        { label: t('venues') },
      ]}
      action={headerActions}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={Building2} iconTone="indigo" value={pagination.total} label={t('venue', { ar: 'قاعات', en: 'Venues' })} />
          <UiStat icon={CheckCircle} iconTone="emerald" value={activeCount} label={t('active')} />
        </UiStats>

        <UiCard toolbar={toolbar} ariaLabel={t('venues')} className="ui-card--flat ui-card--venues-toolbar">
          {loading ? (
            <UiTableSkeleton rows={8} cols={8} />
          ) : venues.length === 0 ? (
            <div className="py-16 text-center text-[var(--admin-text-muted)]">{t('noData')}</div>
          ) : (
            <>
              <UiTable tableClassName="ui-table--venues" minWidth={960}>
                <thead>
                  <tr>
                    <th className="ui-table-col--image">{t('image', { ar: 'الصورة', en: 'Image' })}</th>
                    <th className="ui-table-col--name">{t('name')}</th>
                    <th className="ui-table-col--provider hidden md:table-cell">{t('provider')}</th>
                    <th className="ui-table-col--price">{t('price')}</th>
                    <th className="ui-table-col--rating hidden sm:table-cell">{t('rating')}</th>
                    <th className="ui-table-col--bookings hidden lg:table-cell">{t('bookings')}</th>
                    <th className="ui-table-col--status">{t('status')}</th>
                    <th className="ui-table-col--actions text-end">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                {venues.map((venue) => {
                  const venueName = venue.nameAr || venue.name
                  const providerName = venue.provider?.nameAr || venue.provider?.name || '—'
                  const priceValue = (Number(venue.price) || 0).toFixed(2)

                  return (
                  <tr
                    key={venue.id}
                    className="ui-table-row--clickable"
                    onClick={() => navigate(readOnly ? `/admin/venues/${venue.id}` : `/admin/venues/${venue.id}/edit`)}
                  >
                    <td>
                      {venue.images && Array.isArray(venue.images) && venue.images.length > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedVenue(venue)
                            setSelectedImageIndex(0)
                            setShowGallery(true)
                          }}
                          className="ui-table-thumb group"
                        >
                          <img
                            src={formatImageSrc(venue.images[0], 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200')}
                            alt={venue.nameAr || venue.name}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'
                            }}
                          />
                          {venue.images.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="text-xs font-semibold text-white">+{venue.images.length - 1}</span>
                            </div>
                          )}
                        </button>
                      ) : (
                        <div className="ui-table-thumb ui-table-thumb--empty">
                          {t('noImage', { ar: 'لا توجد صورة', en: 'No image' })}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="ui-table-cell-stack">
                        <span className="ui-table-cell-stack__primary" title={venueName}>{venueName}</span>
                        <span className="ui-table-cell-stack__secondary">{venue.location || '—'}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="ui-table-provider" title={providerName}>{providerName}</span>
                    </td>
                    <td>
                      <div className="ui-table-cell-stack ui-table-cell-stack--price">
                        <span className="ui-table-cell-stack__primary tabular-nums">{priceValue}</span>
                        <span className="ui-table-cell-stack__secondary">{t('currency')}</span>
                      </div>
                    </td>
                    <td className="ui-table-cell--nowrap hidden sm:table-cell">
                      <span className="ui-table-rating" dir="ltr">
                        <span className="ui-table-rating__star" aria-hidden="true">★</span>
                        <span className="ui-table-rating__value">{(Number(venue.rating) || 0).toFixed(1)}</span>
                        <span className="ui-table-rating__count">({venue.reviewCount || 0})</span>
                      </span>
                    </td>
                    <td className="ui-table-cell--nowrap hidden lg:table-cell">
                      <span className="ui-table-bookings">{venue._count?.bookings || 0}</span>
                    </td>
                    <td className="ui-table-cell--nowrap">
                      <Badge variant={venue.isActive ? 'success' : 'danger'} className="ui-badge--nowrap">
                        {venue.isActive ? t('active') : t('inactive')}
                      </Badge>
                    </td>
                    <td className="ui-table-cell--nowrap">
                      <div className="ui-actions" onClick={(e) => e.stopPropagation()}>
                        {readOnly ? (
                          <button type="button" onClick={() => navigate(`/admin/venues/${venue.id}`)} className="ui-action-btn" title={t('view', { ar: 'عرض', en: 'View' })}>
                            <Eye size={16} aria-hidden />
                          </button>
                        ) : (
                          <>
                            <button type="button" onClick={() => navigate(`/admin/venues/${venue.id}/calendar`)} className="ui-action-btn" title={t('calendar', { ar: 'التقويم', en: 'Calendar' })}>
                              <CalendarDays size={16} aria-hidden />
                            </button>
                            <button type="button" onClick={() => navigate(`/admin/venues/${venue.id}/settings`)} className="ui-action-btn" title={t('settings')}>
                              <Settings size={16} aria-hidden />
                            </button>
                            <button type="button" onClick={() => navigate(`/admin/venues/${venue.id}/edit`)} className="ui-action-btn" title={t('edit')}>
                              <Pencil size={16} aria-hidden />
                            </button>
                            <button type="button" onClick={(e) => toggleStatus(e, venue.id, venue.isActive)} className="ui-action-btn" title={venue.isActive ? t('deactivate') : t('activate')}>
                              {venue.isActive ? <Power size={16} aria-hidden /> : <CircleCheck size={16} aria-hidden />}
                            </button>
                            <button type="button" onClick={(e) => deleteVenue(e, venue.id)} className="ui-action-btn ui-action-btn--danger" title={t('delete')}>
                              <Trash2 size={16} aria-hidden />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
                </tbody>
              </UiTable>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                total={pagination.total}
                limit={pagination.limit}
              />
            </>
          )}
        </UiCard>
      </AdminContent>

      {/* Gallery Modal */}
      {showGallery && selectedVenue && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowGallery(false)}>
          <div className="relative flex max-h-[min(90vh,calc(100vh-2rem))] w-full max-w-[calc(100vw-2rem)] flex-col" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6L18 18"/>
              </svg>
            </button>
            <div className="relative flex-1 flex items-center justify-center">
              {selectedVenue.images && Array.isArray(selectedVenue.images) && selectedVenue.images.length > 0 ? (
                <img
                  src={formatImageSrc(selectedVenue.images[selectedImageIndex], 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800')}
                  alt={`${selectedVenue.nameAr || selectedVenue.name} ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'
                  }}
                />
              ) : (
                <div className="text-white text-center">
                  <p>{t('noImages', { ar: 'لا توجد صور', en: 'No images available' })}</p>
                </div>
              )}
            </div>
            {selectedVenue.images && Array.isArray(selectedVenue.images) && selectedVenue.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : selectedVenue.images.length - 1))
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18L9 12L15 6"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((prev) => (prev < selectedVenue.images.length - 1 ? prev + 1 : 0))
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18L15 12L9 6"/>
                  </svg>
                </button>
                <div className="flex justify-center gap-2 mt-4 overflow-x-auto px-4">
                  {selectedVenue.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImageIndex(idx)
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === selectedImageIndex ? 'border-white' : 'border-white/30'
                      }`}
                    >
                      <img
                        src={formatImageSrc(img, 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200')}
                        alt={`${selectedVenue.nameAr || selectedVenue.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'
                        }}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-white text-center mt-2 text-sm">
                  {selectedImageIndex + 1} / {selectedVenue.images.length}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </AdminPage>
  )
}

export default Venues
