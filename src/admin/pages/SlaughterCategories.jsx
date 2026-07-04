import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Image as ImageIcon, Plus, Trash2, X, RefreshCw, Layers, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import AdminPage from '../components/AdminPage'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { AdminContent, Badge, SearchInput, UiCard, UiStats, UiStat, UiTable, UiTableSkeleton } from '../design-system'
import { apiOrigin, getSlaughterApiMode } from '../utils/adminSession'

const token = () => localStorage.getItem('admin_token')
const headers = () => ({ Authorization: `Bearer ${token()}` })

const initialForm = {
  name: '',
  nameAr: '',
  description: '',
  descriptionAr: '',
  order: 0,
  isActive: true,
}

export default function SlaughterCategories() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const confirmDelete = useConfirmDelete()
  const rtl = i18n.language === 'ar'
  const categoryReadOnly = false

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState(initialForm)
  const [iconFile, setIconFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { origin, headers: hdr, useVendorCategoryApi } = getSlaughterApiMode()
      const url = useVendorCategoryApi
        ? `${origin}/api/mobile/vendor/slaughter/categories`
        : `${origin}/api/admin/slaughter/categories`
      const { data } = await axios.get(url, { headers: hdr })
      setCategories(data.categories || [])
    } catch {
      toast.error(t('slaughterCategories.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const openModal = (cat = null) => {
    setEditing(cat)
    if (cat) {
      setFormData({
        name: cat.name || '',
        nameAr: cat.nameAr || '',
        description: cat.description || '',
        descriptionAr: cat.descriptionAr || '',
        order: cat.order || 0,
        isActive: !!cat.isActive,
      })
    } else {
      setFormData(initialForm)
    }
    setIconFile(null)
    setImageFile(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setFormData(initialForm)
    setIconFile(null)
    setImageFile(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (categoryReadOnly) return
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
      if (iconFile) fd.append('icon', iconFile)
      if (imageFile) fd.append('image', imageFile)

      if (editing) {
        const { origin, useVendorCategoryApi } = getSlaughterApiMode()
        await axios.patch(`${origin}${useVendorCategoryApi ? '/api/mobile/vendor/slaughter/categories' : '/api/admin/slaughter/categories'}/${editing.id}`, fd, {
          headers: { ...headers(), 'Content-Type': 'multipart/form-data' },
        })
        toast.success(t('slaughterCategories.saved'))
      } else {
        const { origin, useVendorCategoryApi } = getSlaughterApiMode()
        await axios.post(`${origin}${useVendorCategoryApi ? '/api/mobile/vendor/slaughter/categories' : '/api/admin/slaughter/categories'}`, fd, {
          headers: { ...headers(), 'Content-Type': 'multipart/form-data' },
        })
        toast.success(t('slaughterCategories.created'))
      }
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || t('slaughterCategories.saveFailed'))
    }
  }

  const handleDelete = async (id) => {
    if (categoryReadOnly) return
    const r = await confirmDelete({ text: t('slaughterCategories.confirmDelete') })
    if (!r.isConfirmed) return
    try {
      const { origin, useVendorCategoryApi } = getSlaughterApiMode()
      await axios.delete(`${origin}${useVendorCategoryApi ? '/api/mobile/vendor/slaughter/categories' : '/api/admin/slaughter/categories'}/${id}`, { headers: headers() })
      toast.success(t('slaughterCategories.deleted'))
      load()
    } catch {
      toast.error(t('slaughterCategories.deleteFailed'))
    }
  }

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (c.nameAr || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
  })

  const activeCount = categories.filter((c) => c.isActive).length
  const productTotal = categories.reduce((acc, c) => acc + (c._count?.products || 0), 0)

  const headerAction = !categoryReadOnly ? (
    <button type="button" onClick={() => openModal()} className="ads-btn ads-btn-primary gap-2">
      <Plus className="h-4 w-4" aria-hidden />
      {t('slaughterCategories.add')}
    </button>
  ) : null

  const toolbar = (
    <>
      <div className="ui-search">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('slaughterCategories.searchPh')}
        />
      </div>
      <button type="button" onClick={load} className="ads-btn ads-btn-subtle gap-2">
        <RefreshCw className="h-4 w-4" aria-hidden />
        {t('slaughterCategories.refresh')}
      </button>
      <button type="button" onClick={() => setSearch('')} className="ads-btn ads-btn-subtle gap-2">
        <X className="h-4 w-4" aria-hidden />
        {t('slaughterCategories.clearSearch')}
      </button>
    </>
  )

  return (
    <AdminPage
      title={t('slaughterCategories.title')}
      subtitle={t('slaughterCategories.panelTitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughterCategories.title') },
      ]}
      action={headerAction}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={Layers} iconTone="indigo" value={categories.length} label={t('slaughterCategories.statTotal')} />
          <UiStat icon={Layers} iconTone="emerald" value={activeCount} label={t('slaughterCategories.statActive')} />
          <UiStat icon={Layers} iconTone="amber" value={productTotal} label={t('slaughterCategories.statProducts')} />
        </UiStats>

        <UiCard toolbar={toolbar} ariaLabel={t('slaughterCategories.panelTitle')}>
          {loading ? (
            <UiTableSkeleton rows={6} cols={6} />
          ) : !filteredCategories.length ? (
            <div className="py-16 text-center text-[var(--admin-text-muted)]">{t('slaughterCategories.empty')}</div>
          ) : (
            <UiTable minWidth={800}>
              <thead>
                <tr>
                  <th>{t('slaughterCategories.tableImage')}</th>
                  <th>{t('slaughterCategories.tableName')}</th>
                  <th>{t('slaughterCategories.tableOrder')}</th>
                  <th>{t('slaughterCategories.tableStatus')}</th>
                  <th>{t('slaughterCategories.tableProductCount')}</th>
                  <th className="text-end">{t('slaughterCategories.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[var(--admin-bg)]/60">
                    <td>
                      {c.image ? (
                        <img
                          src={`${apiOrigin()}${c.image}`}
                          alt={c.nameAr}
                          className="h-12 w-12 rounded-xl border border-[var(--admin-border)] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)]">
                          <ImageIcon className="h-5 w-5" aria-hidden />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="font-semibold text-[var(--admin-text)]">{c.nameAr}</div>
                      <div className="text-xs text-[var(--admin-text-muted)]">{c.name}</div>
                    </td>
                    <td>{c.order}</td>
                    <td>
                      <Badge variant={c.isActive ? 'success' : 'danger'}>
                        {c.isActive ? t('slaughterCategories.active') : t('slaughterCategories.inactive')}
                      </Badge>
                    </td>
                    <td>{c._count?.products || 0}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {!categoryReadOnly ? (
                        <div className="ui-actions">
                          <button type="button" onClick={() => navigate(`/admin/slaughter/categories/${c.id}`)} className="ui-action-btn" title={t('common.view')}>
                            <Eye size={16} aria-hidden />
                          </button>
                          <button type="button" onClick={() => openModal(c)} className="ui-action-btn" title={t('slaughterCategories.edit')}>
                            <Pencil size={16} aria-hidden />
                          </button>
                          <button type="button" onClick={() => handleDelete(c.id)} className="ui-action-btn ui-action-btn--danger" title={t('slaughterCategories.delete')}>
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--admin-text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </UiTable>
          )}
        </UiCard>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="admin-modal-panel w-full max-w-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--elevation-modal)]" role="dialog" aria-modal="true">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--admin-text)]">
                  {editing ? t('slaughterCategories.modalEdit') : t('slaughterCategories.modalAdd')}
                </h2>
                <button type="button" onClick={closeModal} className="rounded-lg p-1 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-muted)]">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder={t('slaughterCategories.phNameAr')}
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="admin-input"
                  />
                  <input
                    placeholder={t('slaughterCategories.phNameEn')}
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    min="0"
                    placeholder={t('slaughterCategories.phOrder')}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="admin-input"
                  />
                  <label className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--admin-border)] px-3 text-sm text-[var(--admin-text)]">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    {t('slaughterCategories.activeCheck')}
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-[var(--admin-text-muted)]">{t('slaughterCategories.imageLabel')}</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="w-full rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-sm"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-[var(--admin-text-muted)]">{t('slaughterCategories.iconLabel')}</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                      className="w-full rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <textarea
                    placeholder={t('slaughterCategories.phDescAr')}
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="min-h-[6rem] rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text)] outline-none focus:ring-2 focus:ring-[var(--admin-accent)]"
                  />
                  <textarea
                    placeholder={t('slaughterCategories.phDescEn')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[6rem] rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text)] outline-none focus:ring-2 focus:ring-[var(--admin-accent)]"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="ads-btn ads-btn-primary flex-1 justify-center">
                    {t('slaughterCategories.save')}
                  </button>
                  <button type="button" onClick={closeModal} className="ads-btn ads-btn-subtle flex-1 justify-center">
                    {t('slaughterCategories.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminContent>
    </AdminPage>
  )
}
