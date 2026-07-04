import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../../contexts/LanguageContext'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import { API_URL } from '../../utils/adminSession'
import Modal from '../../components/Modal'
import { Badge, EmptyState } from '../../design-system'

export default function SlidersPanel() {
  const { language } = useLanguage()
  const [sliders, setSliders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSlider, setEditingSlider] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    image: '',
    link: '',
    order: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchSliders()
  }, [])

  const fetchSliders = async () => {
    try {
      const response = await axios.get(`${API_URL}/sliders`)
      setSliders(response.data.sliders || [])
    } catch (error) {
      console.error('Error fetching sliders:', error)
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
    const reader = new FileReader()
    reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('admin_token')
      if (editingSlider) {
        await axios.patch(`${API_URL}/sliders/${editingSlider.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(language === 'ar' ? 'تم التحديث' : 'Updated')
      } else {
        await axios.post(`${API_URL}/sliders`, formData, { headers: { Authorization: `Bearer ${token}` } })
        toast.success(language === 'ar' ? 'تمت الإضافة' : 'Added')
      }
      setShowModal(false)
      setEditingSlider(null)
      resetForm()
      fetchSliders()
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'))
    }
  }

  const handleEdit = (slider) => {
    setEditingSlider(slider)
    setFormData({
      title: slider.title || '',
      titleAr: slider.titleAr || '',
      description: slider.description || '',
      descriptionAr: slider.descriptionAr || '',
      image: slider.image || '',
      link: slider.link || '',
      order: slider.order || 0,
      isActive: slider.isActive !== undefined ? slider.isActive : true,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'ar' ? 'حذف هذا السلايدر؟' : 'Delete this slider?')) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/sliders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted')
      fetchSliders()
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل' : 'Failed'))
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      image: '',
      link: '',
      order: 0,
      isActive: true,
    })
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
            setEditingSlider(null)
            setShowModal(true)
          }}
          className="ads-btn ads-btn-primary gap-2"
        >
          <Plus size={18} aria-hidden />
          {language === 'ar' ? 'إضافة سلايدر' : 'Add slider'}
        </button>
      </div>

      {sliders.length === 0 ? (
        <EmptyState
          title={language === 'ar' ? 'لا توجد سلايدرات' : 'No sliders'}
          description={language === 'ar' ? 'أضف سلايدراً للصفحة الرئيسية' : 'Add a slider for the home screen'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sliders.map((slider) => (
            <article key={slider.id} className="ui-media-card">
              <div className="ui-media-card__image">
                {slider.image ? (
                  <img src={slider.image} alt="" />
                ) : (
                  <ImageIcon size={40} className="text-[var(--admin-text-muted)]" aria-hidden />
                )}
                <Badge variant={slider.isActive ? 'success' : 'danger'} className="absolute top-2 end-2">
                  {slider.isActive ? (language === 'ar' ? 'نشط' : 'Active') : language === 'ar' ? 'متوقف' : 'Off'}
                </Badge>
              </div>
              <div className="ui-media-card__body">
                <h3 className="m-0 font-semibold">{language === 'ar' ? slider.titleAr : slider.title}</h3>
                <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
                  {language === 'ar' ? 'الترتيب' : 'Order'}: {slider.order}
                </p>
                <div className="ui-actions mt-3">
                  <button type="button" onClick={() => handleEdit(slider)} className="ui-action-btn" title="Edit">
                    <Pencil size={16} aria-hidden />
                  </button>
                  <button type="button" onClick={() => handleDelete(slider.id)} className="ui-action-btn ui-action-btn--danger" title="Delete">
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
          setEditingSlider(null)
          resetForm()
        }}
        title={editingSlider ? (language === 'ar' ? 'تعديل سلايدر' : 'Edit slider') : language === 'ar' ? 'إضافة سلايدر' : 'Add slider'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <div>
            <label className="mb-1 block text-sm font-semibold">{language === 'ar' ? 'العنوان (EN)' : 'Title (EN)'}</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="admin-input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{language === 'ar' ? 'العنوان (AR)' : 'Title (AR)'}</label>
            <input type="text" name="titleAr" value={formData.titleAr} onChange={handleChange} className="admin-input" dir="rtl" />
          </div>
          <div className="span-2">
            <label className="mb-1 block text-sm font-semibold">{language === 'ar' ? 'الصورة' : 'Image'}</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="admin-input" />
            {formData.image ? <img src={formData.image} alt="" className="mt-2 max-h-40 rounded-xl object-cover" /> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{language === 'ar' ? 'الترتيب' : 'Order'}</label>
            <input type="number" name="order" value={formData.order} onChange={handleChange} className="admin-input" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 accent-[var(--admin-accent)]" />
            <label>{language === 'ar' ? 'نشط' : 'Active'}</label>
          </div>
          <div className="span-2 flex gap-2 border-t border-[var(--admin-border)] pt-4">
            <button type="submit" className="ads-btn ads-btn-primary flex-1">
              {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="ads-btn ads-btn-subtle flex-1">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
