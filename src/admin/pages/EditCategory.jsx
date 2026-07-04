import { API_URL, adminAuthHeaders } from '../utils/adminSession'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import AdminFormShell from '../components/AdminFormShell'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatImageSrc } from '../../utils/imageUtils'


function EditCategory() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { language, t } = useLanguage()
  const ar = language === 'ar'
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    icon: '',
    image: ''
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    fetchCategory()
  }, [id])

  const fetchCategory = async () => {
    try {
      setFetching(true)
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: '', limit: 1000 }
      })
      const category = (response.data.categories || []).find(cat => cat.id === id)
      if (category) {
        setFormData({
          name: category.name || '',
          nameAr: category.nameAr || '',
          description: category.description || '',
          icon: category.icon || '',
          image: category.image || ''
        })
        if (category.image) {
          // If image is a file path, use formatImageSrc, otherwise use directly
          const previewSrc = category.image.startsWith('/uploads/') 
            ? formatImageSrc(category.image) 
            : category.image
          setImagePreview(previewSrc)
        }
      } else {
        toast.error(language === 'ar' ? 'الفئة غير موجودة' : 'Category not found')
        navigate('/admin/categories')
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      toast.error(language === 'ar' ? 'فشل تحميل بيانات الفئة' : 'Failed to load category data')
      navigate('/admin/categories')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? 'الملف المحدد ليس صورة' : 'Selected file is not an image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5MB)' : 'Image size is too large (max 5MB)')
      return
    }

    // Store the file directly (don't convert to base64)
    setImageFile(file)
    
    // Create preview URL from file
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    
    // Also store file name for reference
    setFormData(prev => ({ ...prev, image: file.name }))
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }))
    setImagePreview(null)
    setImageFile(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name || !formData.nameAr) {
      toast.error(language === 'ar' ? 'يجب إدخال الاسم بالعربية والإنجليزية' : 'Name in both Arabic and English is required')
      return
    }
    
    // Validate image is provided
    if (!formData.image || formData.image.trim() === '') {
      toast.error(language === 'ar' ? 'يجب إضافة صورة للفئة' : 'Category image is required')
      return
    }
    
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('nameAr', formData.nameAr)
      submitData.append('description', formData.description || '')
      submitData.append('icon', formData.icon || '')
      
      // Handle image - prefer file upload, fallback to URL
      if (imageFile) {
        // Send as file (preferred method)
        submitData.append('image', imageFile)
      } else if (formData.image && formData.image.trim() !== '') {
        // If it's a URL, send as string field (backend will handle it)
        if (formData.image.startsWith('http://') || formData.image.startsWith('https://')) {
          submitData.append('image', formData.image)
        } else if (formData.image.startsWith('data:image/')) {
          // Base64 image - convert to blob and send as file
          try {
            const base64Data = formData.image.split(',')[1] || formData.image
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'image/jpeg' })
            const file = new File([blob], 'category-image.jpg', { type: 'image/jpeg' })
            submitData.append('image', file)
          } catch (error) {
            console.error('Error converting base64 to file:', error)
            // Fallback: send as string
            submitData.append('image', formData.image)
          }
        } else {
          // Assume it's a URL or path
          submitData.append('image', formData.image)
        }
      }
      
      await axios.patch(`${API_URL}/admin/categories/${id}`, submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success(language === 'ar' ? 'تم تحديث الفئة بنجاح' : 'Category updated successfully')
      navigate('/admin/categories')
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل تحديث الفئة' : 'Failed to update category'))
    } finally {
      setLoading(false)
    }
  }

  const title = ar ? 'تعديل الفئة' : 'Edit category'
  if (fetching) {
    return <AdminFormShell title={title} backTo="/admin/categories" backLabel={t('nav.categories')} loading />
  }

  return (
    <AdminFormShell
      title={title}
      subtitle={formData.nameAr || formData.name}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.categories'), path: '/admin/categories' },
        { label: title },
      ]}
      backTo="/admin/categories"
      backLabel={t('nav.categories')}
      footer={
        <>
          <button type="button" onClick={() => navigate('/admin/categories')} className="ads-btn ads-btn-subtle">
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
          <button type="submit" form="edit-category-form" disabled={loading} className="ads-btn ads-btn-primary min-w-[120px]">
            {loading ? (ar ? 'جاري الحفظ…' : 'Saving…') : ar ? 'تحديث' : 'Update'}
          </button>
        </>
      }
    >
          <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="admin-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                {language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'} *
              </label>
              <input
                type="text"
                name="nameAr"
                value={formData.nameAr}
                onChange={handleInputChange}
                className="admin-input"
                dir="rtl"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'الوصف' : 'Description'}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="admin-input"
                dir="rtl"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'صورة الفئة' : 'Category Image'} *
              </label>
              <div className="space-y-3">
                {imagePreview && (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="admin-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'ar' ? 'الحد الأقصى لحجم الصورة: 5MB' : 'Maximum image size: 5MB'}
                  </p>
                </div>
                {!imagePreview && (
                  <div className="text-sm text-gray-500">
                    {language === 'ar' ? 'أو أدخل رابط الصورة:' : 'Or enter image URL:'}
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value })
                        if (e.target.value) setImagePreview(e.target.value)
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="admin-input mt-2"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'أيقونة (اختياري)' : 'Icon (Optional)'}
              </label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                placeholder="🔖"
                className="admin-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'يتم عرض الأيقونة فقط في حالة عدم وجود صورة' : 'Icon is only shown when no image is available'}
              </p>
            </div>

          </form>
    </AdminFormShell>
  )
}

export default EditCategory

