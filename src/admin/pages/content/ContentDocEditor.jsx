import { useState, useEffect } from 'react'
import axios from 'axios'
import { Save, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { API_URL } from '../../utils/adminSession'
import { Badge } from '../../design-system'

/** Editable static page (about / privacy / terms). */
export default function ContentDocEditor({ endpoint, language }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    content: '',
    contentAr: '',
    isActive: true,
  })

  useEffect(() => {
    fetchDoc()
  }, [endpoint])

  const fetchDoc = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/content/${endpoint}`)
      const key = endpoint
      if (response.data[key]) setFormData(response.data[key])
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/content/${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully')
      setEditing(false)
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]" />
      </div>
    )
  }

  if (!editing) {
    return (
      <div className="ui-form-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-lg font-semibold text-[var(--admin-text)]">
            {language === 'ar' ? formData.titleAr : formData.title}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant={formData.isActive ? 'success' : 'danger'}>
              {formData.isActive ? (language === 'ar' ? 'نشط' : 'Active') : language === 'ar' ? 'غير نشط' : 'Inactive'}
            </Badge>
            <button type="button" onClick={() => setEditing(true)} className="ads-btn ads-btn-primary gap-2">
              <Pencil size={16} aria-hidden />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </button>
          </div>
        </div>
        <div className="whitespace-pre-wrap text-[var(--admin-text)] leading-relaxed" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {language === 'ar' ? formData.contentAr : formData.content}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="ui-form-panel">
      <div className="admin-form-grid">
        <div>
          <label className="mb-1 block text-sm font-semibold">{language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="admin-input" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">{language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
          <input type="text" name="titleAr" value={formData.titleAr} onChange={handleChange} className="admin-input" dir="rtl" required />
        </div>
        <div className="span-2">
          <label className="mb-1 block text-sm font-semibold">{language === 'ar' ? 'المحتوى (إنجليزي)' : 'Content (English)'}</label>
          <textarea name="content" value={formData.content} onChange={handleChange} rows={10} className="admin-input min-h-[200px] py-3" required />
        </div>
        <div className="span-2">
          <label className="mb-1 block text-sm font-semibold">{language === 'ar' ? 'المحتوى (عربي)' : 'Content (Arabic)'}</label>
          <textarea name="contentAr" value={formData.contentAr} onChange={handleChange} rows={10} className="admin-input min-h-[200px] py-3" dir="rtl" required />
        </div>
        <div className="span-2 flex items-center gap-2">
          <input type="checkbox" name="isActive" id={`active-${endpoint}`} checked={formData.isActive} onChange={handleChange} className="h-4 w-4 accent-[var(--admin-accent)]" />
          <label htmlFor={`active-${endpoint}`}>{language === 'ar' ? 'نشط' : 'Active'}</label>
        </div>
        <div className="span-2 flex justify-end gap-2 border-t border-[var(--admin-border)] pt-4">
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              fetchDoc()
            }}
            className="ads-btn ads-btn-subtle"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button type="submit" disabled={saving} className="ads-btn ads-btn-primary gap-2">
            <Save size={16} aria-hidden />
            {saving ? (language === 'ar' ? 'جاري الحفظ…' : 'Saving…') : language === 'ar' ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  )
}
