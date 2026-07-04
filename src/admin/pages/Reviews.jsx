import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FileBarChart, Star, Trash2, MessageSquare } from 'lucide-react'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { API_URL, getMarketplaceVendorApiConfig, usesProviderApis } from '../utils/adminSession'
import ModernListPage from '../components/ModernListPage'
import {
  UiStats,
  UiStat,
  SearchInput,
  UiTable,
  Badge,
  UiChipGroup,
  UiChip,
} from '../design-system'

const RATING_CHIPS = [
  { value: '', ar: 'الكل', en: 'All' },
  { value: '5', ar: '5 نجوم', en: '5 stars' },
  { value: '4', ar: '4 نجوم', en: '4 stars' },
  { value: '3', ar: '3 نجوم', en: '3 stars' },
  { value: '2', ar: '2 نجوم', en: '2 stars' },
  { value: '1', ar: '1 نجمة', en: '1 star' },
]

function Reviews() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRating, setFilterRating] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 10,
    totalPages: 0,
  })

  useEffect(() => {
    fetchReviews()
  }, [search, filterRating, pagination.currentPage])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      const vendorApi = getMarketplaceVendorApiConfig()
      const reviewsPath = usesProviderApis() ? vendorApi.reviewsUrl : `${API_URL}/admin/reviews`
      const response = await axios.get(reviewsPath, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, rating: filterRating || undefined, limit: pagination.limit, offset },
      })
      setReviews(response.data.reviews || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit),
      }))
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const token = localStorage.getItem('admin_token')
      const vendorApi = getMarketplaceVendorApiConfig()
      const delPath = usesProviderApis() ? vendorApi.reviewUrl(id) : `${API_URL}/admin/reviews/${id}`
      await axios.delete(delPath, { headers: { Authorization: `Bearer ${token}` } })
      fetchReviews()
    } catch (error) {
      toast.error(error.response?.data?.error || t('deleteFailed'))
    }
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }

  const avgRating = useMemo(() => {
    if (!reviews.length) return '—'
    const sum = reviews.reduce((s, r) => s + (r.rating || 0), 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

  const fiveStar = useMemo(() => reviews.filter((r) => r.rating === 5).length, [reviews])

  const toolbar = (
    <>
      <div className="ui-search">
        <SearchInput placeholder={t('searchReviews')} onDebouncedChange={(v) => { setSearch(v); setPagination((p) => ({ ...p, currentPage: 1 })) }} />
      </div>
      <UiChipGroup ariaLabel={t('rating')}>
        {RATING_CHIPS.map((c) => (
          <UiChip
            key={c.value || 'all'}
            active={filterRating === c.value}
            onClick={() => {
              setFilterRating(c.value)
              setPagination((p) => ({ ...p, currentPage: 1 }))
            }}
          >
            {language === 'ar' ? c.ar : c.en}
          </UiChip>
        ))}
      </UiChipGroup>
    </>
  )

  return (
    <ModernListPage
      title={t('reviews', { ar: 'التقييمات', en: 'Reviews' })}
      subtitle={t('reviewsSubtitle', { ar: 'آراء العملاء عن الخدمات والقاعات', en: 'Customer feedback on services and venues' })}
      breadcrumbs={[
        { label: t('nav.dashboard', { ar: 'الرئيسية', en: 'Home' }), path: '/admin/dashboard' },
        { label: t('reviews') },
      ]}
      action={
        <button type="button" onClick={() => navigate('/admin/reports?generate=reviews')} className="ads-btn ads-btn-subtle gap-2">
          <FileBarChart size={18} aria-hidden />
          {t('report')}
        </button>
      }
      stats={
        <UiStats>
          <UiStat icon={MessageSquare} iconTone="indigo" value={pagination.total} label={t('review', { ar: 'تقييمات', en: 'Reviews' })} />
          <UiStat icon={Star} iconTone="amber" value={avgRating} label={language === 'ar' ? 'متوسط التقييم' : 'Avg. rating'} />
          <UiStat icon={Star} iconTone="emerald" value={fiveStar} label={language === 'ar' ? '5 نجوم (الصفحة)' : '5★ on page'} />
        </UiStats>
      }
      toolbar={toolbar}
      loading={loading}
      empty={!loading && reviews.length === 0}
      emptyTitle={t('noData')}
      emptyDescription={t('searchReviews')}
    >
      <>
        <UiTable minWidth={960} tableClassName="ui-table--people">
          <thead>
            <tr>
              <th className="ui-table-col--name">{t('user')}</th>
              <th>{t('rating')}</th>
              <th>{t('comment')}</th>
              <th>{t('service')}/{t('venue')}</th>
              <th className="hidden sm:table-cell">{t('date')}</th>
              <th className="text-end">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td className="ui-table-cell--user">
                  <div className="ui-user-cell">
                    <div className="ui-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {(review.user?.name || 'U').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="ui-user-name">{review.user?.name || t('user')}</div>
                      <div className="ui-user-meta">{review.user?.phone || '—'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'warning' : 'danger'}>
                    {review.rating}/5 ★
                  </Badge>
                </td>
                <td className="max-w-xs truncate text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  {review.comment || '—'}
                </td>
                <td>
                  {review.service ? (
                    <Badge variant="info">{review.service.nameAr || review.service.name}</Badge>
                  ) : review.venue ? (
                    <Badge variant="success">{review.venue.nameAr || review.venue.name}</Badge>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="hidden sm:table-cell text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  {new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </td>
                <td>
                  <div className="ui-actions">
                    <button type="button" onClick={() => handleDelete(review.id)} className="ui-action-btn ui-action-btn--danger" title={t('delete')}>
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
    </ModernListPage>
  )
}

export default Reviews
