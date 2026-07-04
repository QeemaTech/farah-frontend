import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import {
  AdminContent,
  Badge,
  SearchInput,
  UiCard,
  UiStats,
  UiStat,
  UiChipGroup,
  UiChip,
  UiTable,
  UiTableSkeleton,
} from '../design-system'
import { Target, CheckCircle, Plus, FileText, Pencil, Trash2, Power, CircleCheck, Save, X, Image as ImageIcon, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatImageSrc, parseImagesArray } from '../../utils/imageUtils'
import { API_URL, getMobileVendorApiBase, usesProviderApis, parseAdminBoolean } from '../utils/adminSession'

function serviceTypeLabel(type, language) {
  const map = {
    VENUE: { ar: 'قاعة', en: 'Venue' },
    FOOD_PROVIDER: { ar: 'مقدم طعام', en: 'Food Provider' },
    PHOTOGRAPHER: { ar: 'مصور', en: 'Photographer' },
    CAR: { ar: 'سيارة', en: 'Car' },
    DECORATION: { ar: 'ديكور', en: 'Decoration' },
    DJ: { ar: 'دي جي', en: 'DJ' },
    FLORIST: { ar: 'بائع زهور', en: 'Florist' },
    OTHER: { ar: 'أخرى', en: 'Other' },
  }
  const entry = map[type] || map.OTHER
  return language === 'ar' ? entry.ar : entry.en
}

function Services() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterServiceType, setFilterServiceType] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 10,
    totalPages: 0
  })
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
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
    images: [],
  })
  const [imagePreviews, setImagePreviews] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchServices()
    fetchCategories()
    fetchProviders()
  }, [search, filterActive, filterCategory, filterServiceType, pagination.currentPage])

  const fetchCategories = async () => {
    if (usesProviderApis()) return
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      })
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProviders = async () => {
    if (usesProviderApis()) return
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'PROVIDER', limit: 1000 }
      })
      setProviders(response.data.users || [])
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      if (usesProviderApis()) {
        const response = await axios.get(`${getMobileVendorApiBase()}/services`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: pagination.limit, offset },
        })
        setServices(response.data.services || [])
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: Math.ceil((response.data.total || 0) / prev.limit),
        }))
        return
      }
      const response = await axios.get(`${API_URL}/admin/services`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          search, 
          isActive: filterActive || undefined,
          categoryId: filterCategory || undefined,
          serviceType: filterServiceType || undefined,
          limit: pagination.limit,
          offset
        }
      })
      setServices(response.data.services || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit)
      }))
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const toggleStatus = async (e, id, isActive) => {
    e.preventDefault()
    e.stopPropagation()
    if (usesProviderApis()) return
    const currentlyActive = parseAdminBoolean(isActive)
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/admin/services/${id}/status`, 
        { isActive: !currentlyActive },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(
        !currentlyActive
          ? t('serviceActivated', { ar: 'تم تفعيل الخدمة', en: 'Service activated' })
          : t('serviceDeactivated', { ar: 'تم إلغاء تفعيل الخدمة', en: 'Service deactivated' })
      )
      fetchServices()
    } catch (error) {
      console.error('Error updating service status:', error)
      toast.error(error.response?.data?.error || t('updateFailed'))
    }
  }

  const deleteService = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    if (usesProviderApis()) return
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/admin/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(t('serviceDeleted', { ar: 'تم حذف الخدمة بنجاح', en: 'Service deleted successfully' }))
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error(error.response?.data?.error || t('deleteFailed'))
    }
  }

  const handleEditService = (e, service) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/admin/services/${service.id}/edit`)
  }

  const handleFormChange = (e) => {
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
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.nameAr || !formData.price || !formData.categoryId || !formData.providerId) {
      toast.error(t('fillRequiredFields', { ar: 'يرجى ملء جميع الحقول المطلوبة', en: 'Please fill all required fields' }))
      return
    }

    try {
      setFormLoading(true)
      const token = localStorage.getItem('admin_token')
      
      // Use FormData if we have new image files, otherwise use JSON
      const hasNewImages = imageFiles.length > 0
      
      if (hasNewImages) {
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
        
        // Append new image files
        imageFiles.forEach((file) => {
          formDataToSend.append('images', file)
        })
        
        // Append existing images (URLs) if editing
        if (editingService && formData.images.length > 0) {
          formData.images.forEach((img) => {
            if (img && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/uploads/'))) {
              formDataToSend.append('existingImages', img)
            }
          })
        }

        if (editingService) {
          await axios.put(`${API_URL}/admin/services/${editingService.id}`, formDataToSend, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          })
          toast.success(t('serviceUpdated', { ar: 'تم تحديث الخدمة بنجاح', en: 'Service updated successfully' }))
        } else {
          await axios.post(`${API_URL}/admin/services`, formDataToSend, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          })
          toast.success(t('serviceAdded', { ar: 'تم إضافة الخدمة بنجاح', en: 'Service added successfully' }))
        }
      } else {
        // No new images, use JSON
        const submitData = {
          ...formData,
          price: parseFloat(formData.price) || 0,
          pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour) : null,
          commission: parseFloat(formData.commission) || 5.0,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          images: Array.isArray(formData.images) ? formData.images : [],
        }

        if (editingService) {
          await axios.put(`${API_URL}/admin/services/${editingService.id}`, submitData, {
            headers: { Authorization: `Bearer ${token}` }
          })
          toast.success(t('serviceUpdated', { ar: 'تم تحديث الخدمة بنجاح', en: 'Service updated successfully' }))
        } else {
          await axios.post(`${API_URL}/admin/services`, submitData, {
            headers: { Authorization: `Bearer ${token}` }
          })
          toast.success(t('serviceAdded', { ar: 'تم إضافة الخدمة بنجاح', en: 'Service added successfully' }))
        }
      }

      setShowForm(false)
      setEditingService(null)
      fetchServices()
    } catch (error) {
      toast.error(error.response?.data?.error || t('operationFailed'))
    } finally {
      setFormLoading(false)
    }
  }

  const activeCount = services.filter((s) => s.isActive).length

  const headerActions = !usesProviderApis() ? (
    <>
      <button type="button" onClick={() => navigate('/admin/services/add')} className="ads-btn ads-btn-primary gap-2">
        <Plus size={18} aria-hidden />
        {t('addService', { ar: 'إضافة خدمة', en: 'Add service' })}
      </button>
      <button type="button" onClick={() => navigate('/admin/reports?generate=services')} className="ads-btn ads-btn-subtle gap-2">
        <FileText size={18} aria-hidden />
        {t('report')}
      </button>
    </>
  ) : null

  const toolbar = (
    <>
      <div className="ui-card__toolbar-start">
        <div className="ui-search ui-search--compact">
          <SearchInput
            placeholder={t('searchServices', { ar: 'ابحث في الخدمات...', en: 'Search services...' })}
            onDebouncedChange={(v) => {
              setSearch(v)
              setPagination((prev) => ({ ...prev, currentPage: 1 }))
            }}
          />
        </div>
        {!usesProviderApis() && categories.length > 0 ? (
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              setPagination((prev) => ({ ...prev, currentPage: 1 }))
            }}
            className="admin-input ui-toolbar-select"
            dir={language}
            aria-label={t('category')}
          >
            <option value="">{t('allCategories', { ar: 'جميع الفئات', en: 'All Categories' })}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {language === 'ar' ? cat.nameAr || cat.name : cat.name || cat.nameAr}
              </option>
            ))}
          </select>
        ) : null}
        <select
          value={filterServiceType}
          onChange={(e) => {
            setFilterServiceType(e.target.value)
            setPagination((prev) => ({ ...prev, currentPage: 1 }))
          }}
          className="admin-input ui-toolbar-select"
          dir={language}
          aria-label={t('serviceType', { ar: 'نوع الخدمة', en: 'Service Type' })}
        >
          <option value="">{t('allTypes', { ar: 'جميع الأنواع', en: 'All Types' })}</option>
          {['VENUE', 'FOOD_PROVIDER', 'PHOTOGRAPHER', 'CAR', 'DECORATION', 'DJ', 'FLORIST', 'OTHER'].map((type) => (
            <option key={type} value={type}>
              {serviceTypeLabel(type, language)}
            </option>
          ))}
        </select>
      </div>
      <UiChipGroup className="ui-card__toolbar-chips ui-card__toolbar-chips--end" ariaLabel={t('status')}>
        {[
          { value: '', label: t('allServices', { ar: 'الكل', en: 'All' }) },
          { value: 'true', label: t('active') },
          { value: 'false', label: t('inactive') },
        ].map((c) => (
          <UiChip
            key={c.value || 'all'}
            active={filterActive === c.value}
            onClick={() => {
              setFilterActive(c.value)
              setPagination((prev) => ({ ...prev, currentPage: 1 }))
            }}
          >
            {c.label}
          </UiChip>
        ))}
      </UiChipGroup>
    </>
  )

  return (
    <AdminPage
      title={t('services', { ar: 'الخدمات', en: 'Services' })}
      subtitle={language === 'ar' ? 'إدارة الخدمات المرتبطة بالقاعات والموردين' : 'Manage venue and provider services'}
      breadcrumbs={[
        { label: t('nav.dashboard', { ar: 'الرئيسية', en: 'Home' }), path: '/admin/dashboard' },
        { label: t('services') },
      ]}
      action={headerActions}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={Target} iconTone="indigo" value={pagination.total} label={t('service', { ar: 'خدمات', en: 'Services' })} />
          <UiStat icon={CheckCircle} iconTone="emerald" value={activeCount} label={t('active')} />
        </UiStats>
        <UiCard toolbar={toolbar} ariaLabel={t('services')} className="ui-card--flat ui-card--venues-toolbar ui-card--toolbar-inline">
          {loading ? (
            <UiTableSkeleton rows={8} cols={10} />
          ) : services.length === 0 ? (
            <div className="py-16 text-center text-[var(--admin-text-muted)]">{t('noData')}</div>
          ) : (
            <>
              <UiTable tableClassName="ui-table--venues" minWidth={1100}>
                <thead>
                  <tr>
                    <th className="ui-table-col--image">{t('image', { ar: 'الصورة', en: 'Image' })}</th>
                    <th className="ui-table-col--name">{t('name')}</th>
                    <th className="ui-table-col--category hidden md:table-cell">{t('category')}</th>
                    <th className="hidden lg:table-cell">{t('serviceType', { ar: 'النوع', en: 'Type' })}</th>
                    <th className="ui-table-col--provider hidden lg:table-cell">{t('provider')}</th>
                    <th className="ui-table-col--price">{t('price')}</th>
                    <th className="ui-table-col--rating hidden sm:table-cell">{t('rating')}</th>
                    <th className="ui-table-col--bookings hidden lg:table-cell">{t('bookings')}</th>
                    <th className="ui-table-col--status">{t('status')}</th>
                    <th className="ui-table-col--actions text-end">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => {
                    const serviceImages = parseImagesArray(service.images)
                    const coverImage = serviceImages.length > 0 ? formatImageSrc(serviceImages[0]) : null
                    const serviceName = language === 'ar' ? (service.nameAr || service.name) : (service.name || service.nameAr)
                    const categoryName = language === 'ar'
                      ? (service.category?.nameAr || service.category?.name)
                      : (service.category?.name || service.category?.nameAr)
                    const providerName = language === 'ar'
                      ? (service.provider?.nameAr || service.provider?.name)
                      : (service.provider?.name || service.provider?.nameAr)
                    const priceValue = (Number(service.price) || 0).toFixed(2)

                    return (
                      <tr
                        key={service.id}
                        className="ui-table-row--clickable"
                        onClick={() => navigate(`/admin/services/${service.id}`)}
                      >
                        <td>
                          {coverImage ? (
                            <div className="ui-table-thumb">
                              <img
                                src={coverImage}
                                alt={serviceName}
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'
                                }}
                              />
                            </div>
                          ) : (
                            <div className="ui-table-thumb ui-table-thumb--empty">
                              {t('noImage', { ar: 'لا توجد صورة', en: 'No image' })}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="ui-table-cell-stack">
                            <span className="ui-table-cell-stack__primary" title={serviceName}>{serviceName}</span>
                            <span className="ui-table-cell-stack__secondary">{service.location || '—'}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell ui-table-cell--nowrap">
                          <Badge variant="info" className="ui-badge--nowrap">
                            {categoryName || '—'}
                          </Badge>
                        </td>
                        <td className="hidden lg:table-cell ui-table-cell--nowrap">
                          <Badge variant="default" className="ui-badge--nowrap">
                            {serviceTypeLabel(service.serviceType, language)}
                          </Badge>
                        </td>
                        <td className="hidden lg:table-cell">
                          <span className="ui-table-provider" title={providerName || '—'}>
                            {providerName || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="ui-table-cell-stack ui-table-cell-stack--price">
                            <span className="ui-table-cell-stack__primary tabular-nums">{priceValue}</span>
                            <span className="ui-table-cell-stack__secondary">{t('currency')}</span>
                          </div>
                        </td>
                        <td className="ui-table-cell--nowrap hidden sm:table-cell">
                          <span className="ui-table-rating" dir="ltr">
                            <span className="ui-table-rating__star" aria-hidden="true">★</span>
                            <span className="ui-table-rating__value">{(Number(service.rating) || 0).toFixed(1)}</span>
                            <span className="ui-table-rating__count">({service.reviewCount || 0})</span>
                          </span>
                        </td>
                        <td className="ui-table-cell--nowrap hidden lg:table-cell">
                          <span className="ui-table-bookings">{service._count?.bookings || 0}</span>
                        </td>
                        <td className="ui-table-cell--nowrap">
                          <Badge variant={parseAdminBoolean(service.isActive) ? 'success' : 'danger'} className="ui-badge--nowrap">
                            {parseAdminBoolean(service.isActive) ? t('active') : t('inactive')}
                          </Badge>
                        </td>
                        <td className="ui-table-cell--nowrap">
                          <div className="ui-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/services/${service.id}`)}
                              className="ui-action-btn"
                              title={t('serviceDetail.viewDetails', { ar: 'عرض التفاصيل', en: 'View details' })}
                            >
                              <Eye size={16} aria-hidden />
                            </button>
                            {!usesProviderApis() ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleEditService(e, service)}
                                  className="ui-action-btn"
                                  title={t('edit')}
                                >
                                  <Pencil size={16} aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => toggleStatus(e, service.id, service.isActive)}
                                  className="ui-action-btn"
                                  title={parseAdminBoolean(service.isActive) ? t('deactivate') : t('activate')}
                                >
                                  {parseAdminBoolean(service.isActive) ? <Power size={16} aria-hidden /> : <CircleCheck size={16} aria-hidden />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => deleteService(e, service.id)}
                                  className="ui-action-btn ui-action-btn--danger"
                                  title={t('delete')}
                                >
                                  <Trash2 size={16} aria-hidden />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </UiTable>
              {pagination.totalPages > 0 ? (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  total={pagination.total}
                  limit={pagination.limit}
                />
              ) : null}
            </>
          )}
        </UiCard>
      </AdminContent>

      {/* Add/Edit Service Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="admin-modal-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 shadow-[var(--elevation-modal)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[var(--admin-text)]">
                {editingService ? t('editService', { ar: 'تعديل خدمة', en: 'Edit Service' }) : t('addService', { ar: 'إضافة خدمة', en: 'Add Service' })}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingService(null)
                  setFormData({ name: '', nameAr: '', description: '', descriptionAr: '', price: '', pricePerHour: '', commission: '5.0', categoryId: '', providerId: '', serviceType: 'OTHER', location: '', address: '', latitude: '', longitude: '', workingHoursStart: '', workingHoursEnd: '', worksInVenues: true, worksExternal: true, requiresVenue: false, images: [] })
                  setImagePreviews([])
                  setImageFiles([])
                }}
                className="rounded-lg p-1 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-text)]"
              >
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('name')} (EN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="admin-input"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('name')} (AR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nameAr"
                    value={formData.nameAr}
                    onChange={handleFormChange}
                    required
                    className="admin-input"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                  {t('description')} (EN)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="admin-input"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                  {t('description')} (AR)
                </label>
                <textarea
                  name="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={handleFormChange}
                  rows={3}
                  className="admin-input"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('price')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step="0.01"
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('commission')} (%)
                  </label>
                  <input
                    type="number"
                    name="commission"
                    value={formData.commission}
                    onChange={handleFormChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('location')}
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('category')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleFormChange}
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('provider')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="providerId"
                    value={formData.providerId}
                    onChange={handleFormChange}
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

              {/* Service Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                  {t('serviceType', { ar: 'نوع الخدمة', en: 'Service Type' })} <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleFormChange}
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

              {/* Price Per Hour */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('pricePerHour', { ar: 'السعر بالساعة', en: 'Price Per Hour' })} ({t('optional', { ar: 'اختياري', en: 'Optional' })})
                  </label>
                  <input
                    type="number"
                    name="pricePerHour"
                    value={formData.pricePerHour}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('address', { ar: 'العنوان', en: 'Address' })} ({t('optional', { ar: 'اختياري', en: 'Optional' })})
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('latitude', { ar: 'خط العرض', en: 'Latitude' })} ({t('optional', { ar: 'اختياري', en: 'Optional' })})
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleFormChange}
                    step="0.000001"
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('longitude', { ar: 'خط الطول', en: 'Longitude' })} ({t('optional', { ar: 'اختياري', en: 'Optional' })})
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleFormChange}
                    step="0.000001"
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('workingHoursStart', { ar: 'ساعة بدء العمل', en: 'Working Hours Start' })} ({t('optional', { ar: 'اختياري', en: 'Optional' })})
                  </label>
                  <input
                    type="time"
                    name="workingHoursStart"
                    value={formData.workingHoursStart}
                    onChange={handleFormChange}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                    {t('workingHoursEnd', { ar: 'ساعة انتهاء العمل', en: 'Working Hours End' })} ({t('optional', { ar: 'اختياري', en: 'Optional' })})
                  </label>
                  <input
                    type="time"
                    name="workingHoursEnd"
                    value={formData.workingHoursEnd}
                    onChange={handleFormChange}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Location Capabilities */}
              <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
                <label className="mb-3 block text-sm font-medium text-[var(--admin-text-muted)]">
                  {t('locationCapabilities', { ar: 'قدرات الموقع', en: 'Location Capabilities' })}
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="checkbox"
                      name="worksInVenues"
                      checked={formData.worksInVenues}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
                    />
                    <span className="text-sm text-[var(--admin-text)]">{t('worksInVenues', { ar: 'يعمل داخل القاعات', en: 'Works inside venues' })}</span>
                  </label>
                  <label className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="checkbox"
                      name="worksExternal"
                      checked={formData.worksExternal}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
                    />
                    <span className="text-sm text-[var(--admin-text)]">{t('worksExternal', { ar: 'يعمل خارج القاعات (منزل، فندق، خارجي)', en: 'Works externally (home, hotel, outdoor)' })}</span>
                  </label>
                  <label className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="checkbox"
                      name="requiresVenue"
                      checked={formData.requiresVenue}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)]"
                    />
                    <span className="text-sm text-[var(--admin-text)]">{t('requiresVenue', { ar: 'يتطلب قاعة (لا يمكن الحجز بدون قاعة)', en: 'Requires venue (cannot be booked without venue)' })}</span>
                  </label>
                </div>
              </div>

              {/* Cover Images Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--admin-text-muted)]">
                  {t('coverImages', { ar: 'صور الغلاف', en: 'Cover Images' })} ({imagePreviews.length}/10)
                </label>
                <p className="mb-3 text-xs text-[var(--admin-text-muted)]">
                  {language === 'ar' ? 'أضف صوراً للخدمة. الصورة الأولى ستكون صورة الغلاف الرئيسية التي تظهر في القوائم' : 'Add images for the service. The first image will be the main cover image shown in listings'}
                </p>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-24 w-full rounded-lg border border-[var(--admin-border)] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 10 && (
                    <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--admin-border)] transition-colors hover:border-[var(--admin-accent)]">
                      <ImageIcon className="h-6 w-6 text-[var(--admin-text-muted)]" aria-hidden />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 ads-btn ads-btn-primary"
                >
                  {formLoading && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>}
                  <Save className="h-5 w-5" />
                  {t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingService(null)
                    setFormData({ name: '', nameAr: '', description: '', descriptionAr: '', price: '', pricePerHour: '', commission: '5.0', categoryId: '', providerId: '', serviceType: 'OTHER', location: '', address: '', latitude: '', longitude: '', workingHoursStart: '', workingHoursEnd: '', worksInVenues: true, worksExternal: true, requiresVenue: false, images: [] })
                    setImagePreviews([])
                    setImageFiles([])
                  }}
                  className="ads-btn ads-btn-subtle flex flex-1 items-center justify-center gap-2"
                >
                  <X className="h-5 w-5" />
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminPage>
  )
}

export default Services
