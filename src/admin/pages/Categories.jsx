import { API_URL } from '../utils/adminSession'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Plus, FileBarChart, Pencil, Trash2, Layers, Eye } from 'lucide-react'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatImageSrc } from '../../utils/imageUtils'
import ModernListPage from '../components/ModernListPage'
import {
  UiStats,
  UiStat,
  SearchInput,
  UiTable,
  Badge,
} from '../design-system'

function Categories() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState({})
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 10,
    totalPages: 0,
  })

  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [search, pagination.currentPage])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      const response = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined, limit: pagination.limit, offset },
      })
      setCategories(response.data.categories || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit),
      }))
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchCategories()
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'))
    }
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }


  const totalServices = useMemo(
    () => categories.reduce((s, c) => s + (c._count?.services || 0), 0),
    [categories],
  )

  const headerActions = (
    <>
      <button type="button" onClick={() => navigate('/admin/reports?generate=categories')} className="ads-btn ads-btn-subtle gap-2">
        <FileBarChart size={18} aria-hidden />
        {t('report')}
      </button>
      <button type="button" onClick={() => navigate('/admin/categories/add')} className="ads-btn ads-btn-primary gap-2">
        <Plus size={18} aria-hidden />
        {t('addCategory', { ar: 'إضافة فئة', en: 'Add category' })}
      </button>
    </>
  )

  const toolbar = (
    <div className="ui-search">
      <SearchInput
        placeholder={t('searchCategories', { ar: 'ابحث في الفئات...', en: 'Search categories...' })}
        onDebouncedChange={setSearch}
      />
    </div>
  )

  return (
    <ModernListPage
      title={t('categories', { ar: 'الفئات', en: 'Categories' })}
      subtitle={t('categoriesSubtitle', { ar: 'تنظيم الخدمات حسب الفئات', en: 'Organize services by category' })}
      breadcrumbs={[
        { label: t('nav.dashboard', { ar: 'الرئيسية', en: 'Home' }), path: '/admin/dashboard' },
        { label: t('categories') },
      ]}
      action={headerActions}
      stats={
        <UiStats>
          <UiStat icon={Layers} iconTone="indigo" value={pagination.total} label={t('category', { ar: 'فئات', en: 'Categories' })} />
          <UiStat icon={Layers} iconTone="emerald" value={totalServices} label={t('services', { ar: 'خدمات مرتبطة', en: 'Linked services' })} />
        </UiStats>
      }
      toolbar={toolbar}
      loading={loading}
      empty={!loading && categories.length === 0}
      emptyTitle={t('noData')}
      emptyDescription={t('searchCategories')}
    >
      <>
        <UiTable minWidth={800}>
          <thead>
            <tr>
              <th>{t('image', { ar: 'الصورة', en: 'Image' })}</th>
              <th>{t('nameAr', { ar: 'الاسم (عربي)', en: 'Name (AR)' })}</th>
              <th>{t('name', { ar: 'الاسم (إنجليزي)', en: 'Name (EN)' })}</th>
              <th className="hidden md:table-cell">{t('description')}</th>
              <th>{t('services')}</th>
              <th className="text-end">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  {category.image && !imageErrors[category.id] ? (
                    <img
                      src={formatImageSrc(category.image)}
                      alt=""
                      className="h-14 w-14 rounded-xl object-cover border border-[var(--admin-border)]"
                      onError={() => setImageErrors((prev) => ({ ...prev, [category.id]: true }))}
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-xs text-[var(--admin-text-muted)]">
                      —
                    </div>
                  )}
                </td>
                <td className="font-semibold">{category.nameAr || '—'}</td>
                <td style={{ color: 'var(--admin-text-muted)' }}>{category.name || '—'}</td>
                <td className="hidden md:table-cell max-w-xs truncate text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  {category.description || '—'}
                </td>
                <td>
                  <Badge variant="info">{category._count?.services || 0}</Badge>
                </td>
                <td>
                  <div className="ui-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/categories/${category.id}`)}
                      className="ui-action-btn"
                      title={t('categoryDetail.view', { ar: 'عرض', en: 'View' })}
                    >
                      <Eye size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/categories/${category.id}/edit`)}
                      className="ui-action-btn"
                      title={t('edit')}
                    >
                      <Pencil size={16} aria-hidden />
                    </button>
                    <button type="button" onClick={() => handleDelete(category.id)} className="ui-action-btn ui-action-btn--danger" title={t('delete')}>
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

export default Categories
