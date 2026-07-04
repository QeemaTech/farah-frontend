import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminFormShell, { FormSection } from '../components/AdminFormShell'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { X } from 'lucide-react'
import { API_URL, adminAuthHeaders } from '../utils/adminSession'


function AddService() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [providers, setProviders] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    pricePerHour: '',
    commission: '5.0',
    categoryId: '',
    providerId: '',
    serviceType: 'OTHER',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
    workingHoursStart: '',
    workingHoursEnd: '',
    worksInVenues: true,
    worksExternal: true,
    requiresVenue: false,
  })
  const [imagePreviews, setImagePreviews] = useState([])
  const [imageFiles, setImageFiles] = useState([])

  useEffect(() => {
    fetchCategories()
    fetchProviders()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      })
      setCategories(response.data.categories || [])
    } catch (error) {
      toast.error(t('errorLoadingCategories', { ar: 'خطأ في تحميل الفئات', en: 'Error loading categories' }))
    }
  }

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'PROVIDER', limit: 1000 }
      })
      setProviders(response.data.users || [])
    } catch (error) {
      toast.error(t('errorLoadingProviders', { ar: 'خطأ في تحميل مقدمي الخدمات', en: 'Error loading providers' }))
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const validFiles = []
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('invalidImage', { ar: 'الملف المحدد ليس صورة', en: 'Selected file is not an image' }))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('imageTooLarge', { ar: 'حجم الصورة كبير جداً (الحد الأقصى 5MB)', en: 'Image size is too large (max 5MB)' }))
        return
      }

      validFiles.push(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const preview = event.target.result
        setImagePreviews(prev => [...prev, preview].slice(0, 10))
      }
      reader.readAsDataURL(file)
    })
    
    setImageFiles(prev => [...prev, ...validFiles].slice(0, 10))
  }

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.nameAr || !formData.price || !formData.categoryId || !formData.providerId) {
      toast.error(t('fillRequiredFields', { ar: 'يرجى ملء جميع الحقول المطلوبة', en: 'Please fill all required fields' }))
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      
      // Use FormData for file uploads
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('nameAr', formData.nameAr)
      if (formData.description) formDataToSend.append('description', formData.description)
      if (formData.descriptionAr) formDataToSend.append('descriptionAr', formData.descriptionAr)
      formDataToSend.append('price', parseFloat(formData.price) || 0)
      if (formData.pricePerHour) formDataToSend.append('pricePerHour', parseFloat(formData.pricePerHour))
      formDataToSend.append('commission', parseFloat(formData.commission) || 5.0)
      formDataToSend.append('categoryId', formData.categoryId)
      formDataToSend.append('providerId', formData.providerId)
      formDataToSend.append('serviceType', formData.serviceType)
      if (formData.location) formDataToSend.append('location', formData.location)
      if (formData.address) formDataToSend.append('address', formData.address)
      if (formData.latitude) formDataToSend.append('latitude', parseFloat(formData.latitude))
      if (formData.longitude) formDataToSend.append('longitude', parseFloat(formData.longitude))
      if (formData.workingHoursStart) formDataToSend.append('workingHoursStart', formData.workingHoursStart)
      if (formData.workingHoursEnd) formDataToSend.append('workingHoursEnd', formData.workingHoursEnd)
      formDataToSend.append('worksInVenues', formData.worksInVenues)
      formDataToSend.append('worksExternal', formData.worksExternal)
      formDataToSend.append('requiresVenue', formData.requiresVenue)
      
      // Append image files
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file)
      })

      await axios.post(`${API_URL}/admin/services`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      
      toast.success(t('serviceAdded', { ar: 'تم إضافة الخدمة بنجاح', en: 'Service added successfully' }))
      navigate('/admin/services')
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || t('errorAddingService', { ar: 'خطأ في إضافة الخدمة', en: 'Error adding service' })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const ar = language === 'ar'
  return (
    <AdminFormShell
      title={t('addService', { ar: 'إضافة خدمة', en: 'Add Service' })}
      subtitle={ar ? 'خدمة جديدة مرتبطة بمورد أو قاعة' : 'New service linked to a provider or venue'}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.services'), path: '/admin/services' },
        { label: t('addService', { ar: 'إضافة', en: 'Add' }) },
      ]}
      backTo="/admin/services"
      backLabel={t('nav.services')}
      loading={loading}
      footer={
        <>
          <button type="button" onClick={() => navigate('/admin/services')} className="ads-btn ads-btn-subtle">
            {t('cancel')}
          </button>
          <button type="submit" form="add-service-form" disabled={loading} className="ads-btn ads-btn-primary min-w-[140px] gap-2">
            {loading ? t('adding', { ar: 'جاري الإضافة…', en: 'Adding…' }) : t('addService', { ar: 'إضافة خدمة', en: 'Add Service' })}
          </button>
        </>
      }
    >
        <form id="add-service-form" onSubmit={handleSubmit} className="space-y-8">
          <FormSection title={t('basicInfo', { ar: 'المعلومات الأساسية', en: 'Basic Information' })}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('name')} (EN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                  dir="ltr"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('name')} (AR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nameAr"
                  value={formData.nameAr}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                  dir="rtl"
                />
              </div>
            </div>
          </FormSection>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('description')} (EN)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="admin-input"
              dir="ltr"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('description')} (AR)
            </label>
            <textarea
              name="descriptionAr"
              value={formData.descriptionAr}
              onChange={handleInputChange}
              rows={4}
              className="admin-input"
              dir="rtl"
            />
          </div>

          {/* Service Type & Category */}
          <div>
            <h3 className={`text-lg font-semibold text-gray-800 mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('serviceTypeCategory', { ar: 'نوع الخدمة والفئة', en: 'Service Type & Category' })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('serviceType', { ar: 'نوع الخدمة', en: 'Service Type' })} <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                  dir={language}
                >
                  <option value="VENUE">{t('venue', { ar: 'قاعة', en: 'Venue' })}</option>
                  <option value="FOOD_PROVIDER">{t('foodProvider', { ar: 'مقدم طعام', en: 'Food Provider' })}</option>
                  <option value="PHOTOGRAPHER">{t('photographer', { ar: 'مصور', en: 'Photographer' })}</option>
                  <option value="CAR">{t('car', { ar: 'سيارة', en: 'Car' })}</option>
                  <option value="DECORATION">{t('decoration', { ar: 'ديكور', en: 'Decoration' })}</option>
                  <option value="DJ">{t('dj', { ar: 'دي جي', en: 'DJ' })}</option>
                  <option value="FLORIST">{t('florist', { ar: 'بائع زهور', en: 'Florist' })}</option>
                  <option value="OTHER">{t('other', { ar: 'أخرى', en: 'Other' })}</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                  dir={language}
                >
                  <option value="">{t('selectCategory', { ar: 'اختر الفئة', en: 'Select Category' })}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {language === 'ar' ? (category.nameAr || category.name) : (category.name || category.nameAr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Provider */}
          <div>
            <h3 className={`text-lg font-semibold text-gray-800 mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('pricingProvider', { ar: 'التسعير ومقدم الخدمة', en: 'Pricing & Provider' })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('price')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="admin-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('pricePerHour', { ar: 'السعر بالساعة', en: 'Price Per Hour' })}
                </label>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="admin-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('commission')} (%)
                </label>
                <input
                  type="number"
                  name="commission"
                  value={formData.commission}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className="admin-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('provider')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                  dir={language}
                >
                  <option value="">{t('selectProvider', { ar: 'اختر مقدم الخدمة', en: 'Select Provider' })}</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {language === 'ar' ? (provider.nameAr || provider.name) : (provider.name || provider.nameAr)} - {provider.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className={`text-lg font-semibold text-gray-800 mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('location', { ar: 'الموقع', en: 'Location' })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('location')}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="admin-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('address', { ar: 'العنوان التفصيلي', en: 'Address' })}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="admin-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('latitude', { ar: 'خط العرض', en: 'Latitude' })}
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="0.000001"
                  placeholder="29.3117"
                  className="admin-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('longitude', { ar: 'خط الطول', en: 'Longitude' })}
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="0.000001"
                  placeholder="47.4818"
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h3 className={`text-lg font-semibold text-gray-800 mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('workingHours', { ar: 'ساعات العمل', en: 'Working Hours' })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('workingHoursStart', { ar: 'ساعة بدء العمل', en: 'Working Hours Start' })}
                </label>
                <input
                  type="time"
                  name="workingHoursStart"
                  value={formData.workingHoursStart}
                  onChange={handleInputChange}
                  className="admin-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('workingHoursEnd', { ar: 'ساعة انتهاء العمل', en: 'Working Hours End' })}
                </label>
                <input
                  type="time"
                  name="workingHoursEnd"
                  value={formData.workingHoursEnd}
                  onChange={handleInputChange}
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* Location Capabilities */}
          <div>
            <h3 className={`text-lg font-semibold text-gray-800 mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('locationCapabilities', { ar: 'قدرات الموقع', en: 'Location Capabilities' })}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <label className={`flex items-center gap-3 cursor-pointer ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <input
                  type="checkbox"
                  name="worksInVenues"
                  checked={formData.worksInVenues}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#2d2871] border-gray-300 rounded focus:ring-[#2d2871]"
                />
                <span className="text-sm font-medium text-gray-700">{t('worksInVenues', { ar: 'يعمل داخل القاعات', en: 'Works inside venues' })}</span>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <input
                  type="checkbox"
                  name="worksExternal"
                  checked={formData.worksExternal}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#2d2871] border-gray-300 rounded focus:ring-[#2d2871]"
                />
                <span className="text-sm font-medium text-gray-700">{t('worksExternal', { ar: 'يعمل خارج القاعات (منزل، فندق، خارجي)', en: 'Works externally (home, hotel, outdoor)' })}</span>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <input
                  type="checkbox"
                  name="requiresVenue"
                  checked={formData.requiresVenue}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#2d2871] border-gray-300 rounded focus:ring-[#2d2871]"
                />
                <span className="text-sm font-medium text-gray-700">{t('requiresVenue', { ar: 'يتطلب قاعة (لا يمكن الحجز بدون قاعة)', en: 'Requires venue (cannot be booked without venue)' })}</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('images', { ar: 'الصور', en: 'Images' })} ({imagePreviews.length}/10)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="admin-input"
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>
    </AdminFormShell>
  )
}

export default AddService

















