import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import MapPreview from '../components/MapPreview'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'
import { formatImageSrc } from '../../utils/imageUtils'
import { API_URL, adminAuthHeaders } from '../utils/adminSession'
import {
  MapPin,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  DollarSign,
  Package,
  ArrowLeft,
  Map,
  ShoppingBag,
  CreditCard,
  TrendingUp,
} from 'lucide-react'
import Modal from '../components/Modal'
import UiTabs from '../../components/ui/UiTabs'
import { AdminContent, Badge, UiCard, UiStat, UiStats } from '../design-system'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'


const TABS = [
  { id: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: Package },
  { id: 'locations', labelEn: 'Location & Branches', labelAr: 'الموقع والفروع', icon: Map },
  { id: 'orders', labelEn: 'Orders', labelAr: 'الطلبات', icon: ShoppingBag },
  { id: 'services', labelEn: 'Services', labelAr: 'الخدمات', icon: Package },
  { id: 'transactions', labelEn: 'Transactions', labelAr: 'المعاملات', icon: CreditCard },
]

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function OrderMapModal({ order, vendor, onClose, language }) {
  const vLat = order.vendorLatitude ?? order.vendorLocation?.latitude ?? vendor?.latitude
  const vLng = order.vendorLongitude ?? order.vendorLocation?.longitude ?? vendor?.longitude
  const cLat = order.customerLatitude
  const cLng = order.customerLongitude
  const hasVendor = vLat != null && vLng != null
  const hasCustomer = cLat != null && cLng != null
  const distanceKm = (hasVendor && hasCustomer) ? haversineKm(vLat, vLng, cLat, cLng) : null
  const center = hasVendor ? [vLat, vLng] : hasCustomer ? [cLat, cLng] : [29.3759, 47.9774]

  return (
    <Modal isOpen onClose={onClose} title={language === 'ar' ? `طلب ${order.orderNumber}` : `Order ${order.orderNumber}`}>
      <div className="space-y-4">
        {distanceKm != null && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {language === 'ar' ? `المسافة بين المتجر والعميل: ${distanceKm.toFixed(2)} كم` : `Distance (vendor ↔ customer): ${distanceKm.toFixed(2)} km`}
          </p>
        )}
        <div className="h-80 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          <MapContainer center={center} zoom={12} className="w-full h-full" scrollWheelZoom>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {hasVendor && <Marker position={[vLat, vLng]}><Popup>{language === 'ar' ? 'موقع المتجر' : 'Vendor location'}</Popup></Marker>}
            {hasCustomer && <Marker position={[cLat, cLng]}><Popup>{language === 'ar' ? 'موقع العميل' : 'Customer location'}</Popup></Marker>}
          </MapContainer>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const VENDOR_TYPES = {
  RESTAURANT: { ar: 'مطعم', en: 'Restaurant' },
  FASHION_STORE: { ar: 'متجر أزياء', en: 'Fashion Store' },
  SWEETS_SHOP: { ar: 'حلويات', en: 'Sweets Shop' },
  HEADPHONES_RENTAL: { ar: 'تأجير سماعات', en: 'Headphones Rental' },
}

function StatusBadge({ status, language }) {
  const map = {
    APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    SUSPENDED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  const c = map[status] || 'bg-gray-100 text-gray-800'
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{status}</span>
}

export default function VendorDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { colors } = useTheme()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editModal, setEditModal] = useState(false)
  const [branchModal, setBranchModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [formData, setFormData] = useState({
    name: '', businessName: '', businessNameAr: '', description: '',
    address: '', country: '', city: '', area: '', latitude: '', longitude: '', googleMapsLink: '', isActive: true,
  })
  const [branchForm, setBranchForm] = useState({
    locationName: '', address: '', city: '', area: '', latitude: '', longitude: '', isMainLocation: false,
  })
  const [orders, setOrders] = useState([])
  const [transactions, setTransactions] = useState([])
  const [orderMapOrder, setOrderMapOrder] = useState(null)

  const fetchVendor = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const res = await axios.get(`${API_URL}/admin/vendors/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setVendor(res.data.vendor)
      setFormData({
        name: res.data.vendor.name || '',
        businessName: res.data.vendor.businessName || '',
        businessNameAr: res.data.vendor.businessNameAr || '',
        description: res.data.vendor.description || '',
        address: res.data.vendor.address || '',
        country: res.data.vendor.country || '',
        city: res.data.vendor.city || '',
        area: res.data.vendor.area || '',
        latitude: res.data.vendor.latitude ?? '',
        longitude: res.data.vendor.longitude ?? '',
        googleMapsLink: res.data.vendor.googleMapsLink || '',
        isActive: res.data.vendor.isActive !== false,
      })
    } catch (e) {
      toast.error(e.response?.data?.error || (language === 'ar' ? 'فشل تحميل المتجر' : 'Failed to load vendor'))
      navigate('/admin/vendors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) fetchVendor() }, [id])

  useEffect(() => {
    if (!id || !vendor) return
    const token = localStorage.getItem('admin_token')
    axios.get(`${API_URL}/admin/vendors/${id}/orders`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 50 } })
      .then(res => setOrders(res.data.orders || [])).catch(() => setOrders([]))
    axios.get(`${API_URL}/admin/vendors/${id}/transactions`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 30 } })
      .then(res => setTransactions(res.data.transactions || [])).catch(() => setTransactions([]))
  }, [id, vendor])

  const handleSaveVendor = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/admin/vendors/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(language === 'ar' ? 'تم حفظ التعديلات' : 'Settings saved')
      setEditModal(false)
      fetchVendor()
    } catch (e) {
      toast.error(e.response?.data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBranch = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('admin_token')
      const payload = { ...branchForm, latitude: branchForm.latitude || undefined, longitude: branchForm.longitude || undefined }
      if (editingBranch) {
        await axios.patch(`${API_URL}/admin/vendors/${id}/locations/${editingBranch.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        toast.success(language === 'ar' ? 'تم تحديث الفرع' : 'Branch updated')
      } else {
        await axios.post(`${API_URL}/admin/vendors/${id}/locations`, payload, { headers: { Authorization: `Bearer ${token}` } })
        toast.success(language === 'ar' ? 'تم إضافة الفرع' : 'Branch added')
      }
      setBranchModal(false)
      setEditingBranch(null)
      setBranchForm({ locationName: '', address: '', city: '', area: '', latitude: '', longitude: '', isMainLocation: false })
      fetchVendor()
    } catch (e) {
      toast.error(e.response?.data?.error || (language === 'ar' ? 'فشل' : 'Failed'))
    } finally {
      setSaving(false)
    }
  }

  const openEditBranch = (loc) => {
    setEditingBranch(loc)
    setBranchForm({
      locationName: loc.locationName || '', address: loc.address || '', city: loc.city || '', area: loc.area || '',
      latitude: loc.latitude ?? '', longitude: loc.longitude ?? '', isMainLocation: !!loc.isMainLocation,
    })
    setBranchModal(true)
  }

  const deleteBranch = async (locationId) => {
    if (!window.confirm(language === 'ar' ? 'حذف هذا الفرع؟' : 'Delete this branch?')) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/admin/vendors/${id}/locations/${locationId}`, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted')
      fetchVendor()
    } catch (e) {
      toast.error(e.response?.data?.error || (language === 'ar' ? 'فشل الحذف' : 'Delete failed'))
    }
  }

  const googleMapsUrl = (lat, lng) => (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : null

  if (loading || !vendor) {
    return (
      <AdminPage title={language === 'ar' ? 'تفاصيل المتجر' : 'Vendor Details'} pageLoading>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]" />
        </div>
      </AdminPage>
    )
  }

  const mainLat = vendor.latitude ?? null
  const mainLng = vendor.longitude ?? null
  const mainMapUrl = googleMapsUrl(mainLat, mainLng) || vendor.googleMapsLink
  const isRtl = language === 'ar'

  const pageTitle = vendor.businessName || vendor.name
  const typeLabel = (VENDOR_TYPES[vendor.vendorType] || {})[language] || vendor.vendorType
  const pageSubtitle = `${vendor.name} · ${vendor.phone} · ${typeLabel}`

  const uiTabs = TABS.map((tab) => ({
    id: tab.id,
    label: isRtl ? tab.labelAr : tab.labelEn,
    icon: tab.icon,
  }))

  return (
    <AdminPage
      title={pageTitle}
      subtitle={pageSubtitle}
      breadcrumbs={[
        { label: language === 'ar' ? 'الرئيسية' : 'Home', path: '/admin/dashboard' },
        { label: language === 'ar' ? 'الموردون' : 'Vendors', path: '/admin/vendors' },
        { label: pageTitle },
      ]}
      action={
        <>
          <button type="button" onClick={() => navigate('/admin/vendors')} className="ads-btn ads-btn-subtle gap-2">
            <ArrowLeft size={18} />
            {language === 'ar' ? 'الموردون' : 'Vendors'}
          </button>
          <button type="button" onClick={() => setEditModal(true)} className="ads-btn ads-btn-primary gap-2">
            <Pencil size={18} />
            {language === 'ar' ? 'تعديل' : 'Edit'}
          </button>
        </>
      }
    >
      <AdminContent className="gap-6">
        <div className="admin-entity-hero admin-vendor-hero">
          <div className="admin-entity-hero__visual">
            {vendor.avatar ? (
              <img src={formatImageSrc(vendor.avatar)} alt="" className="admin-entity-hero__img admin-entity-hero__img--round" />
            ) : (
              <div className="admin-entity-hero__placeholder admin-entity-hero__placeholder--brand">
                {(vendor.businessName || vendor.name || 'V').charAt(0)}
              </div>
            )}
          </div>
          <div className="admin-entity-hero__body">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  vendor.status === 'APPROVED' ? 'success' : vendor.status === 'PENDING' ? 'warning' : 'danger'
                }
              >
                {vendor.status}
              </Badge>
              <Badge variant="info">{typeLabel}</Badge>
              {vendor.wallet?.isFrozen ? <Badge variant="danger">{language === 'ar' ? 'محفظة مجمدة' : 'Frozen wallet'}</Badge> : null}
            </div>
            <h2>{vendor.businessName || vendor.name}</h2>
            <p className="admin-entity-hero__muted">
              {vendor.name} · <span dir="ltr">{vendor.phone}</span>
            </p>
            <UiStats className="mt-4">
              <UiStat icon={DollarSign} iconTone="amber" value={Number(vendor.wallet?.balance ?? 0).toFixed(3)} label={language === 'ar' ? 'الرصيد' : 'Balance'} />
              <UiStat icon={TrendingUp} iconTone="emerald" value={Number(vendor.wallet?.totalEarnings ?? 0).toFixed(3)} label={language === 'ar' ? 'الأرباح' : 'Earnings'} />
              <UiStat icon={CreditCard} iconTone="slate" value={Number(vendor.wallet?.totalWithdrawn ?? 0).toFixed(3)} label={language === 'ar' ? 'المسحوب' : 'Withdrawn'} />
              <UiStat icon={Package} iconTone="indigo" value={Number(vendor.wallet?.pendingBalance ?? 0).toFixed(3)} label={language === 'ar' ? 'قيد الانتظار' : 'Pending'} />
            </UiStats>
          </div>
        </div>

        <UiTabs tabs={uiTabs} active={activeTab} onChange={setActiveTab} />

        <UiCard ariaLabel={pageTitle}>
          {activeTab === 'overview' && (
            <div className="p-6 sm:p-8">
              {vendor.description ? (
                <p className="mb-6 text-sm leading-relaxed text-[var(--admin-text-muted)]">{vendor.description}</p>
              ) : null}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
                    {language === 'ar' ? 'العنوان' : 'Address'}
                  </p>
                  <p className="font-medium text-[var(--admin-text)]">{vendor.address || '—'}</p>
                  <p className="text-sm text-[var(--admin-text-muted)]">{[vendor.city, vendor.area].filter(Boolean).join(' · ') || '—'}</p>
                  {mainMapUrl ? (
                    <a href={mainMapUrl} target="_blank" rel="noopener noreferrer" className="ads-btn ads-btn-subtle mt-2 inline-flex gap-2">
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      {language === 'ar' ? 'خرائط جوجل' : 'Google Maps'}
                    </a>
                  ) : null}
                </div>
                {mainLat != null && mainLng != null ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--admin-border)]">
                    <MapPreview latitude={mainLat} longitude={mainLng} height={192} interactive />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'الموقع والفروع' : 'Location & Branches'}</h3>
                <button
                  onClick={() => { setEditingBranch(null); setBranchForm({ locationName: '', address: '', city: '', area: '', latitude: '', longitude: '', isMainLocation: false }); setBranchModal(true) }}
                  className="ads-btn ads-btn-primary"
                >
                  <Plus className="h-[18px] w-[18px]" /> {language === 'ar' ? 'إضافة فرع' : 'Add Branch'}
                </button>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="ui-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'الفرع' : 'Branch'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'العنوان' : 'Address'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'المدينة' : 'City'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(vendor.locations || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                          <Map className="mx-auto mb-2 h-10 w-10 text-gray-400 dark:text-gray-500" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'لا توجد فروع.' : 'No branches.'}</p>
                        </td>
                      </tr>
                    ) : (
                      (vendor.locations || []).map((loc) => (
                        <tr key={loc.id} className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                            <span className="font-medium text-gray-900 dark:text-white">{loc.locationName}</span>
                            {loc.isMainLocation && <span className="mr-2 text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 px-1.5 py-0.5 rounded-full">{language === 'ar' ? 'رئيسي' : 'Main'}</span>}
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300">{loc.address || '—'}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300">{loc.city || '—'}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEditBranch(loc)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title={language === 'ar' ? 'تعديل' : 'Edit'}><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => deleteBranch(loc.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title={language === 'ar' ? 'حذف' : 'Delete'}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-6 sm:p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{language === 'ar' ? 'طلبات المتجر' : 'Vendor Orders'}</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="ui-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'خريطة' : 'Map'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                          <ShoppingBag className="mx-auto mb-2 h-10 w-10 text-gray-400 dark:text-gray-500" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'لا توجد طلبات.' : 'No orders.'}</p>
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-medium text-gray-900 dark:text-white">{ord.orderNumber}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300">{ord.customerName} · {ord.customerPhone}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300">{ord.totalAmount?.toFixed(3) ?? '—'}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4"><span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{ord.status}</span></td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                            <button type="button" onClick={() => setOrderMapOrder(ord)} className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline text-sm font-medium">
                              <MapPin className="h-4 w-4" /> {language === 'ar' ? 'عرض على الخريطة' : 'View on map'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="p-6 sm:p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{language === 'ar' ? 'الخدمات / المنتجات' : 'Services / Products'}</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="ui-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'السعر' : 'Price'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'متاح' : 'Available'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(vendor.services?.length ?? 0) === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                          <Package className="mx-auto mb-2 h-10 w-10 text-gray-400 dark:text-gray-500" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'لا توجد خدمات.' : 'No services.'}</p>
                        </td>
                      </tr>
                    ) : (
                      vendor.services.map((svc) => (
                        <tr key={svc.id} className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-medium text-gray-900 dark:text-white">{svc.nameAr || svc.name}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300">{Number(svc.price).toFixed(3)}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                            <span className={svc.isAvailable ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-400 dark:text-gray-500'}>{svc.isAvailable ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="p-6 sm:p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{language === 'ar' ? 'المعاملات الأخيرة' : 'Recent Transactions'}</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="ui-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'النوع' : 'Type'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'الفئة' : 'Category'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-start text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                          <CreditCard className="mx-auto mb-2 h-10 w-10 text-gray-400 dark:text-gray-500" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'لا توجد معاملات.' : 'No transactions.'}</p>
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 20).map((tx) => (
                        <tr key={tx.id} className="hover:bg-gradient-to-r hover:from-orange-50/50 dark:hover:from-orange-900/10 hover:to-transparent transition-colors duration-150">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4"><span className={tx.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>{tx.type}</span></td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300">{tx.category || '—'}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-medium text-gray-900 dark:text-white">{Number(tx.amount).toFixed(3)}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4"><span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{tx.status}</span></td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600 dark:text-gray-400 text-sm">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </UiCard>
      </AdminContent>

      {orderMapOrder && <OrderMapModal order={orderMapOrder} vendor={vendor} onClose={() => setOrderMapOrder(null)} language={language} />}

      {/* Edit vendor modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={language === 'ar' ? 'تعديل المتجر' : 'Edit Vendor'}>
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الاسم' : 'Name'}</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} className="admin-input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'اسم المتجر' : 'Business Name'}</label>
            <input type="text" value={formData.businessName} onChange={(e) => setFormData(f => ({ ...f, businessName: e.target.value }))} className="admin-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'العنوان الكامل' : 'Full Address'}</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))} className="admin-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'الدولة' : 'Country'}</label>
              <input type="text" value={formData.country} onChange={(e) => setFormData(f => ({ ...f, country: e.target.value }))} className="admin-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المدينة' : 'City'}</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData(f => ({ ...f, city: e.target.value }))} className="admin-input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المنطقة' : 'Area'}</label>
            <input type="text" value={formData.area} onChange={(e) => setFormData(f => ({ ...f, area: e.target.value }))} className="admin-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
              <input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData(f => ({ ...f, latitude: e.target.value }))} className="admin-input" placeholder="29.3759" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
              <input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData(f => ({ ...f, longitude: e.target.value }))} className="admin-input" placeholder="47.9774" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'رابط خرائط جوجل' : 'Google Maps Link'}</label>
            <input type="url" value={formData.googleMapsLink} onChange={(e) => setFormData(f => ({ ...f, googleMapsLink: e.target.value }))} className="admin-input" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setEditModal(false)} className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={saving} className="ads-btn ads-btn-primary">
              {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit branch modal */}
      <Modal isOpen={branchModal} onClose={() => { setBranchModal(false); setEditingBranch(null) }} title={editingBranch ? (language === 'ar' ? 'تعديل الفرع' : 'Edit Branch') : (language === 'ar' ? 'إضافة فرع' : 'Add Branch')}>
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'اسم الفرع' : 'Branch Name'}</label>
            <input type="text" value={branchForm.locationName} onChange={(e) => setBranchForm(f => ({ ...f, locationName: e.target.value }))} className="admin-input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'العنوان' : 'Address'}</label>
            <input type="text" value={branchForm.address} onChange={(e) => setBranchForm(f => ({ ...f, address: e.target.value }))} className="admin-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المدينة' : 'City'}</label>
              <input type="text" value={branchForm.city} onChange={(e) => setBranchForm(f => ({ ...f, city: e.target.value }))} className="admin-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'ar' ? 'المنطقة' : 'Area'}</label>
              <input type="text" value={branchForm.area} onChange={(e) => setBranchForm(f => ({ ...f, area: e.target.value }))} className="admin-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
              <input type="number" step="any" value={branchForm.latitude} onChange={(e) => setBranchForm(f => ({ ...f, latitude: e.target.value }))} className="admin-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
              <input type="number" step="any" value={branchForm.longitude} onChange={(e) => setBranchForm(f => ({ ...f, longitude: e.target.value }))} className="admin-input" />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={branchForm.isMainLocation} onChange={(e) => setBranchForm(f => ({ ...f, isMainLocation: e.target.checked }))} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{language === 'ar' ? 'الفرع الرئيسي' : 'Main location'}</span>
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => { setBranchModal(false); setEditingBranch(null) }} className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={saving} className="ads-btn ads-btn-primary">
              {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
            </button>
          </div>
        </form>
      </Modal>
    </AdminPage>
  )
}
