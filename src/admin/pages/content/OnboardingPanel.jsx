import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../../contexts/LanguageContext'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import { API_URL } from '../../utils/adminSession'
import Modal from '../../components/Modal'
import { Badge, EmptyState } from '../../design-system'

function imageSrc(img) {
  if (!img) return null
  if (img.startsWith('data:') || img.startsWith('http')) return img
  return `data:image/jpeg;base64,${img}`
}

export default function OnboardingPanel() {
  const { language, t } = useLanguage()
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    subtitle: '',
    subtitleAr: '',
    image: '',
    order: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/onboarding`, { headers: { Authorization: `Bearer ${token}` } })
      setSlides(response.data.slides || [])
    } catch (error) {
      console.error('Error fetching onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value,
    }))
  }

  const handleImageUpload = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('admin_token')
      if (editingSlide) {
        await axios.put(`${API_URL}/onboarding/${editingSlide.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(t('updateSuccess', { ar: 'تم التحديث', en: 'Updated' }))
      } else {
        await axios.post(`${API_URL}/onboarding`, formData, { headers: { Authorization: `Bearer ${token}` } })
        toast.success(t('addSuccess', { ar: 'تمت الإضافة', en: 'Added' }))
      }
      setShowModal(false)
      setEditingSlide(null)
      resetForm()
      fetchSlides()
    } catch (error) {
      toast.error(error.response?.data?.error || t('updateFailed'))
    }
  }

  const handleEdit = (slide) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title || '',
      titleAr: slide.titleAr || '',
      subtitle: slide.subtitle || '',
      subtitleAr: slide.subtitleAr || '',
      image: slide.image || '',
      order: slide.order || 0,
      isActive: slide.isActive !== undefined ? slide.isActive : true,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete', { ar: 'تأكيد الحذف؟', en: 'Confirm delete?' }))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/onboarding/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(t('deleteSuccess', { ar: 'تم الحذف', en: 'Deleted' }))
      fetchSlides()
    } catch (error) {
      toast.error(error.response?.data?.error || t('deleteFailed'))
    }
  }

  const resetForm = () => {
    setFormData({ title: '', titleAr: '', subtitle: '', subtitleAr: '', image: '', order: 0, isActive: true })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            resetForm()
            setEditingSlide(null)
            setShowModal(true)
          }}
          className="ads-btn ads-btn-primary gap-2"
        >
          <Plus size={18} aria-hidden />
          {language === 'ar' ? 'إضافة شريحة' : 'Add slide'}
        </button>
      </div>

      {slides.length === 0 ? (
        <EmptyState title={t('noData')} description={language === 'ar' ? 'أضف شرائح الترحيب' : 'Add onboarding slides'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slides.map((slide) => (
            <article key={slide.id} className="ui-media-card">
              <div className="ui-media-card__image">
                {slide.image ? <img src={imageSrc(slide.image)} alt="" /> : <ImageIcon size={40} className="text-[var(--admin-text-muted)]" aria-hidden />}
                <Badge variant={slide.isActive ? 'success' : 'danger'} className="absolute top-2 end-2">
                  {slide.isActive ? t('active') : t('inactive')}
                </Badge>
              </div>
              <div className="ui-media-card__body">
                <h3 className="m-0 font-semibold">{language === 'ar' ? slide.titleAr : slide.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--admin-text-muted)]">
                  {language === 'ar' ? slide.subtitleAr : slide.subtitle}
                </p>
                <div className="ui-actions mt-3">
                  <button type="button" onClick={() => handleEdit(slide)} className="ui-action-btn">
                    <Pencil size={16} aria-hidden />
                  </button>
                  <button type="button" onClick={() => handleDelete(slide.id)} className="ui-action-btn ui-action-btn--danger">
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingSlide(null)
          resetForm()
        }}
        title={editingSlide ? t('edit') : t('add')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('title')} (EN)</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="admin-input" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('title')} (AR)</label>
            <input type="text" name="titleAr" value={formData.titleAr} onChange={handleChange} className="admin-input" dir="rtl" required />
          </div>
          <div className="span-2">
            <label className="mb-1 block text-sm font-semibold">{t('image')}</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} className="admin-input" />
            {formData.image ? <img src={imageSrc(formData.image)} alt="" className="mt-2 max-h-40 rounded-xl object-cover" /> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('order', { ar: 'الترتيب', en: 'Order' })}</label>
            <input type="number" name="order" value={formData.order} onChange={handleChange} className="admin-input" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 accent-[var(--admin-accent)]" />
            <label>{t('active')}</label>
          </div>
          <div className="span-2 flex gap-2 border-t border-[var(--admin-border)] pt-4">
            <button type="submit" className="ads-btn ads-btn-primary flex-1">{t('save', { ar: 'حفظ', en: 'Save' })}</button>
            <button type="button" onClick={() => setShowModal(false)} className="ads-btn ads-btn-subtle flex-1">
              {t('cancel')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
