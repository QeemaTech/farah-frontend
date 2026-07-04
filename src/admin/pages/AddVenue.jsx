import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminFormShell, { FormSection } from '../components/AdminFormShell'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatImageSrc } from '../../utils/imageUtils'
import { API_URL, adminAuthHeaders, getMobileVendorApiBase, getVenueApiConfig, readAdminUser, usesProviderApis } from '../utils/adminSession'


function AddVenue() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const venueApi = getVenueApiConfig()
  const providerMode = usesProviderApis()
  const adminUser = readAdminUser()
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    pricePerHour: '',
    commission: '10.0',
    providerId: '',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
    images: [],
    serviceIds: [],
  })
  const [imagePreviews, setImagePreviews] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    if (!providerMode) fetchProviders()
    else if (adminUser?.id) setFormData((prev) => ({ ...prev, providerId: adminUser.id }))
    fetchServices()
  }, [])

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'PROVIDER', limit: 100 }
      })
      setProviders(response.data.users || [])
    } catch (error) {
      console.error('Error fetching providers:', error)
      toast.error(t('errorLoadingProviders', { ar: 'خطأ في تحميل مقدمي الخدمات', en: 'Error loading providers' }))
    }
  }

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const url = providerMode ? `${getMobileVendorApiBase()}/services` : `${API_URL}/admin/services`
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      })
      setServices(response.data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error(t('errorLoadingServices', { ar: 'خطأ في تحميل الخدمات', en: 'Error loading services' }))
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('invalidImage', { ar: 'الملف المحدد ليس صورة', en: 'Selected file is not an image' }))
        return
      }

      // Reduce max size to 1MB to prevent database issues
      if (file.size > 1 * 1024 * 1024) {
        toast.error(t('imageTooLarge', { ar: 'حجم الصورة كبير جداً (الحد الأقصى 1MB)', en: 'Image size is too large (max 1MB)' }))
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target.result
        
        // Compress image if it's still too large after conversion
        // Base64 is approximately 4/3 of original size
        const maxBase64Size = 800000 // ~600KB original = ~800KB base64
        if (base64.length > maxBase64Size) {
          toast.error(t('imageTooLarge', { ar: 'الصورة كبيرة جداً بعد التحويل', en: 'Image too large after conversion' }))
          return
        }
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64].slice(0, 10) // Limit to 10 images
        }))
        setImagePreviews(prev => [...prev, base64].slice(0, 10))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.nameAr || !formData.price || !formData.location || (!providerMode && !formData.providerId)) {
      toast.error(t('fillRequiredFields', { ar: 'يرجى ملء جميع الحقول المطلوبة', en: 'Please fill all required fields' }))
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      
      // Prepare data for API - ensure all fields are properly formatted
      const submitData = {
        ...formData,
        providerId: providerMode ? adminUser.id : formData.providerId,
        price: parseFloat(formData.price) || 0,
        pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour) : null,
        commission: providerMode ? undefined : parseFloat(formData.commission) || 10.0,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        serviceIds: Array.isArray(formData.serviceIds) ? formData.serviceIds : [],
        images: Array.isArray(formData.images) ? formData.images : [],
      }
      
      const response = await axios.post(venueApi.createUrl, submitData, {
        headers: venueApi.headers
      })
      console.log('Venue created successfully:', response.data)
      toast.success(t('venueAdded', { ar: 'تم إضافة القاعة بنجاح', en: 'Venue added successfully' }))
      navigate('/admin/venues')
    } catch (error) {
      console.error('Error adding venue:', error)
      console.error('Error response:', error.response?.data)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || t('errorAddingVenue', { ar: 'خطأ في إضافة القاعة', en: 'Error adding venue' })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const ar = language === 'ar'
  return (
    <AdminFormShell
      title={t('addVenue', { ar: 'إضافة قاعة', en: 'Add Venue' })}
      subtitle={ar ? 'إنشاء قاعة جديدة وربطها بالمورد' : 'Create a new venue and link to a provider'}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.venues'), path: '/admin/venues' },
        { label: t('addVenue', { ar: 'إضافة', en: 'Add' }) },
      ]}
      backTo="/admin/venues"
      backLabel={t('nav.venues')}
      loading={loading}
      footer={
        <>
          <button type="button" onClick={() => navigate('/admin/venues')} className="ads-btn ads-btn-subtle">
            {t('cancel')}
          </button>
          <button type="submit" form="add-venue-form" disabled={loading} className="ads-btn ads-btn-primary min-w-[140px]">
            {loading ? t('adding', { ar: 'جاري الإضافة…', en: 'Adding…' }) : t('addVenue', { ar: 'إضافة قاعة', en: 'Add Venue' })}
          </button>
        </>
      }
    >
        <form id="add-venue-form" onSubmit={handleSubmit} className="space-y-8">
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
                  {t('pricePerHour', { ar: 'السعر للساعة', en: 'Price Per Hour' })}
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
              {!providerMode ? (
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
              ) : null}
              {!providerMode ? (
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
                      {provider.nameAr || provider.name} - {provider.phone}
                    </option>
                  ))}
                </select>
              </div>
              ) : null}
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
                  {t('location')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
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

          <FormSection title={t('services', { ar: 'الخدمات', en: 'Services' })}>
            <div className="admin-checkbox-list">
              {services.length === 0 ? (
                <p className={`text-[var(--admin-text-muted)] text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('noServicesAvailable', { ar: 'لا توجد خدمات متاحة', en: 'No services available' })}
                </p>
              ) : (
                services.map((service) => (
                  <label
                    key={service.id}
                    className={`admin-checkbox-item ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            serviceIds: [...prev.serviceIds, service.id],
                          }))
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            serviceIds: prev.serviceIds.filter((id) => id !== service.id),
                          }))
                        }
                      }}
                    />
                    <span className={`admin-checkbox-item__label ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {service.nameAr || service.name} — {service.price} {t('currency')}
                    </span>
                  </label>
                ))
              )}
            </div>
          </FormSection>

          {/* Capacity */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('capacity', { ar: 'السعة', en: 'Capacity' })}
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              min="1"
                    className="admin-input"
            />
          </div>

          {/* Images */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('images', { ar: 'الصور', en: 'Images' })}
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
                  <div key={index} className="relative">
                    <img
                      src={formatImageSrc(preview) || preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ×
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

export default AddVenue

