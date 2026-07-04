import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import AdminFormShell, { FormSection } from '../components/AdminFormShell'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatImageSrc } from '../../utils/imageUtils'
import { API_URL, getMobileVendorApiBase, getVenueApiConfig, usesProviderApis } from '../utils/adminSession'


function EditVenue() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { language, t } = useLanguage()
  const venueApi = getVenueApiConfig()
  const providerMode = usesProviderApis()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    isActive: true,
  })
  const [imagePreviews, setImagePreviews] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    fetchVenue()
    fetchProviders()
    fetchServices()
  }, [id])

  const fetchVenue = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(venueApi.detailUrl(id), {
        headers: venueApi.headers
      })
      const venue = response.data.venue
      setFormData({
        name: venue.name || '',
        nameAr: venue.nameAr || '',
        description: venue.description || '',
        descriptionAr: venue.descriptionAr || '',
        price: venue.price?.toString() || '',
        pricePerHour: venue.pricePerHour?.toString() || '',
        commission: venue.commission?.toString() || '10.0',
        providerId: venue.providerId || '',
        location: venue.location || '',
        address: venue.address || '',
        latitude: venue.latitude?.toString() || '',
        longitude: venue.longitude?.toString() || '',
        capacity: venue.capacity?.toString() || '',
        images: Array.isArray(venue.images) ? venue.images : [],
        serviceIds: venue.services?.map(vs => vs.serviceId) || [],
        isActive: venue.isActive !== undefined ? venue.isActive : true,
      })
      setImagePreviews(Array.isArray(venue.images) ? venue.images : [])
    } catch (error) {
      console.error('Error fetching venue:', error)
      toast.error(error.response?.data?.error || t('errorLoadingVenue', { ar: 'خطأ في تحميل القاعة', en: 'Error loading venue' }))
      navigate('/admin/venues')
    } finally {
      setLoading(false)
    }
  }

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
    }
  }

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const url = providerMode ? `${getMobileVendorApiBase()}/services` : `${API_URL}/admin/services`
      const response = await axios.get(url, {
        headers: venueApi.headers,
        params: { limit: 1000 }
      })
      setServices(response.data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error(t('errorLoadingServices', { ar: 'خطأ في تحميل الخدمات', en: 'Error loading services' }))
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

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('invalidImage', { ar: 'الملف المحدد ليس صورة', en: 'Selected file is not an image' }))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('imageTooLarge', { ar: 'حجم الصورة كبير جداً (الحد الأقصى 5MB)', en: 'Image size is too large (max 5MB)' }))
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target.result
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64]
        }))
        setImagePreviews(prev => [...prev, base64])
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
    
    if (!formData.name || !formData.nameAr || !formData.price || !formData.providerId || !formData.location) {
      toast.error(t('fillRequiredFields', { ar: 'يرجى ملء جميع الحقول المطلوبة', en: 'Please fill all required fields' }))
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token')
      await axios.put(venueApi.updateUrl(id), formData, {
        headers: venueApi.headers
      })
      toast.success(t('venueUpdated', { ar: 'تم تحديث القاعة بنجاح', en: 'Venue updated successfully' }))
      navigate('/admin/venues')
    } catch (error) {
      console.error('Error updating venue:', error)
      toast.error(error.response?.data?.error || t('errorUpdatingVenue', { ar: 'خطأ في تحديث القاعة', en: 'Error updating venue' }))
    } finally {
      setSaving(false)
    }
  }

  const ar = language === 'ar'
  if (loading) {
    return (
      <AdminFormShell
        title={t('editVenue', { ar: 'تعديل قاعة', en: 'Edit Venue' })}
        backTo="/admin/venues"
        backLabel={t('nav.venues')}
        loading
      />
    )
  }

  return (
    <AdminFormShell
      title={t('editVenue', { ar: 'تعديل قاعة', en: 'Edit Venue' })}
      subtitle={formData.nameAr || formData.name || '—'}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.venues'), path: '/admin/venues' },
        { label: t('editVenue', { ar: 'تعديل', en: 'Edit' }) },
      ]}
      backTo="/admin/venues"
      backLabel={t('nav.venues')}
      footer={
        <>
          <button type="button" onClick={() => navigate('/admin/venues')} className="ads-btn ads-btn-subtle">
            {t('cancel')}
          </button>
          <button type="submit" form="edit-venue-form" disabled={saving} className="ads-btn ads-btn-primary min-w-[140px]">
            {saving ? t('updating', { ar: 'جاري التحديث…', en: 'Updating…' }) : t('updateVenue', { ar: 'تحديث القاعة', en: 'Update venue' })}
          </button>
        </>
      }
    >
        <form id="edit-venue-form" onSubmit={handleSubmit} className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
                  className="admin-input text-left"
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
              className={`min-h-[6rem] w-full rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text)] outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
              className={`min-h-[6rem] w-full rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-sm text-[var(--admin-text)] outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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
                  className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
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

          {/* Capacity & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`admin-input ${language === 'ar' ? 'text-right' : 'text-left'}`}
              />
            </div>
            <div>
              <label className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#2d2871] rounded focus:ring-[#2d2871]"
                />
                <span className="text-sm font-medium text-gray-700">{t('active')}</span>
              </label>
            </div>
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

export default EditVenue

