import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  MapPin,
  Package,
  ShoppingBag,
  Eye,
  Store,
  Clock,
  CheckCircle,
  Pencil,
  Trash2,
  ChevronDown,
  Ban,
  Check,
  X,
} from 'lucide-react'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatImageSrc } from '../../utils/imageUtils'
import { API_URL, adminAuthHeaders } from '../utils/adminSession'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import {
  AdminContent,
  Badge,
  SearchInput,
  EmptyState,
  UiCard,
  UiStat,
  UiStats,
  UiChipGroup,
  UiChip,
  UiTable,
  UiTableSkeleton,
} from '../design-system'

const VENDOR_TYPES = {
  RESTAURANT: { ar: 'مطعم', en: 'Restaurant' },
  FASHION_STORE: { ar: 'متجر أزياء', en: 'Fashion Store' },
  SWEETS_SHOP: { ar: 'حلويات', en: 'Sweets Shop' },
  HEADPHONES_RENTAL: { ar: 'تأجير سماعات', en: 'Headphones Rental' },
  SLAUGHTER_PROVIDER: { ar: 'ذبائح', en: 'Slaughter provider' },
  VENUE_PROVIDER: { ar: 'مزود قاعات', en: 'Venue provider' },
}

const STATUS_VARIANT = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'default',
}

const STATUS_CHIPS = [
  { value: '', ar: 'الكل', en: 'All' },
  { value: 'PENDING', ar: 'قيد الانتظار', en: 'Pending' },
  { value: 'APPROVED', ar: 'موافق', en: 'Approved' },
  { value: 'REJECTED', ar: 'مرفوض', en: 'Rejected' },
  { value: 'SUSPENDED', ar: 'موقوف', en: 'Suspended' },
]

function avatarGradient(seed = '') {
  const g = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #14b8a6)',
  ]
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return g[n % g.length]
}

function Vendors() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const confirmDelete = useConfirmDelete()
  const rtl = language === 'ar'

  const [vendors, setVendors] = useState([])
  const [newOrders, setNewOrders] = useState([])
  const [newOrdersOpen, setNewOrdersOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [pagination, setPagination] = useState({ currentPage: 1, total: 0, limit: 20, totalPages: 0 })

  const fetchNewOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/vendor-orders`, {
        headers: adminAuthHeaders(),
        params: { status: 'PENDING', limit: 15 },
      })
      setNewOrders(res.data.orders || [])
    } catch {
      setNewOrders([])
    }
  }, [])

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/admin/vendors`, {
        headers: adminAuthHeaders(),
        params: {
          search: search || undefined,
          status: filterStatus || undefined,
          page: pagination.currentPage,
          limit: pagination.limit,
        },
      })
      setVendors(response.data.vendors || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit),
      }))
    } catch (error) {
      toast.error(error.response?.data?.error || (rtl ? 'فشل تحميل الموردين' : 'Failed to load vendors'))
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, pagination.currentPage, pagination.limit, rtl])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  useEffect(() => {
    fetchNewOrders()
  }, [fetchNewOrders])

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }

  const refreshAll = () => {
    fetchVendors()
    fetchNewOrders()
  }

  const approveVendor = async (id) => {
    try {
      await axios.patch(`${API_URL}/admin/vendors/${id}/approve`, {}, { headers: adminAuthHeaders() })
      toast.success(rtl ? 'تمت الموافقة' : 'Approved')
      refreshAll()
    } catch (e) {
      toast.error(e.response?.data?.error || t('updateFailed'))
    }
  }

  const rejectVendor = async (id) => {
    const result = await confirmDelete({
      title: rtl ? 'رفض المورد؟' : 'Reject vendor?',
      text: rtl ? 'سيتم تغيير حالة المورد إلى مرفوض.' : 'Vendor status will be set to rejected.',
      confirmButtonText: rtl ? 'رفض' : 'Reject',
    })
    if (!result.isConfirmed) return
    try {
      await axios.patch(`${API_URL}/admin/vendors/${id}/reject`, {}, { headers: adminAuthHeaders() })
      toast.success(rtl ? 'تم الرفض' : 'Rejected')
      refreshAll()
    } catch (e) {
      toast.error(e.response?.data?.error || t('updateFailed'))
    }
  }

  const suspendVendor = async (id) => {
    const result = await confirmDelete({
      title: rtl ? 'إيقاف المورد؟' : 'Suspend vendor?',
      text: rtl ? 'لن يتمكن المورد من استخدام المنصة حتى إعادة التفعيل.' : 'Vendor access will be suspended.',
      confirmButtonText: rtl ? 'إيقاف' : 'Suspend',
    })
    if (!result.isConfirmed) return
    try {
      await axios.patch(`${API_URL}/admin/vendors/${id}/suspend`, {}, { headers: adminAuthHeaders() })
      toast.success(rtl ? 'تم الإيقاف' : 'Suspended')
      refreshAll()
    } catch (e) {
      toast.error(e.response?.data?.error || t('updateFailed'))
    }
  }

  const deleteVendor = async (id, name) => {
    const result = await confirmDelete({
      title: rtl ? 'حذف المورد؟' : 'Delete vendor?',
      text: rtl
        ? `سيتم حذف "${name}" نهائياً مع بياناته. لا يمكن التراجع.`
        : `"${name}" and all related data will be permanently deleted.`,
    })
    if (!result.isConfirmed) return
    try {
      await axios.delete(`${API_URL}/admin/vendors/${id}`, { headers: adminAuthHeaders() })
      toast.success(rtl ? 'تم الحذف' : 'Deleted')
      refreshAll()
    } catch (e) {
      toast.error(e.response?.data?.error || (rtl ? 'فشل الحذف' : 'Delete failed'))
    }
  }

  const pendingCount = useMemo(() => vendors.filter((v) => v.status === 'PENDING').length, [vendors])
  const approvedCount = useMemo(() => vendors.filter((v) => v.status === 'APPROVED').length, [vendors])

  const title = rtl ? 'الموردون' : 'Vendors'
  const headerActions = (
    <button type="button" onClick={() => navigate('/admin/vendors-map')} className="ads-btn ads-btn-subtle gap-2">
      <MapPin size={18} aria-hidden />
      {rtl ? 'الخريطة' : 'Map'}
    </button>
  )

  const toolbar = (
    <>
      <div className="ui-search">
        <SearchInput
          placeholder={rtl ? 'اسم، هاتف، متجر...' : 'Name, phone, business...'}
          onDebouncedChange={(v) => {
            setSearch(v)
            setPagination((p) => ({ ...p, currentPage: 1 }))
          }}
        />
      </div>
      <UiChipGroup ariaLabel={rtl ? 'الحالة' : 'Status'}>
        {STATUS_CHIPS.map((c) => (
          <UiChip
            key={c.value || 'all'}
            active={filterStatus === c.value}
            onClick={() => {
              setFilterStatus(c.value)
              setPagination((p) => ({ ...p, currentPage: 1 }))
            }}
          >
            {rtl ? c.ar : c.en}
          </UiChip>
        ))}
      </UiChipGroup>
    </>
  )

  return (
    <AdminPage
      title={title}
      subtitle={rtl ? 'اعتماد الموردين ومتابعة الطلبات' : 'Approve vendors and monitor orders'}
      breadcrumbs={[
        { label: t('nav.dashboard', { ar: 'الرئيسية', en: 'Home' }), path: '/admin/dashboard' },
        { label: title },
      ]}
      action={headerActions}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={Store} iconTone="indigo" value={pagination.total} label={rtl ? 'إجمالي الموردين' : 'Total vendors'} />
          <UiStat icon={Clock} iconTone="amber" value={pendingCount} label={rtl ? 'بانتظار الموافقة' : 'Pending approval'} />
          <UiStat icon={CheckCircle} iconTone="emerald" value={approvedCount} label={rtl ? 'موافق عليهم' : 'Approved'} />
        </UiStats>

        {newOrders.length > 0 ? (
          <div className="admin-collapsible-panel admin-collapsible-panel--alert">
            <button
              type="button"
              className="admin-collapsible-panel__trigger"
              onClick={() => setNewOrdersOpen((open) => !open)}
              aria-expanded={newOrdersOpen}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <ShoppingBag className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                <span>{rtl ? 'طلبات موردين جديدة' : 'New vendor orders'}</span>
                <Badge variant="warning">{newOrders.length}</Badge>
              </span>
              <ChevronDown
                className={`admin-collapsible-panel__chevron h-5 w-5 ${newOrdersOpen ? 'admin-collapsible-panel__chevron--open' : ''}`}
                aria-hidden
              />
            </button>
            {newOrdersOpen ? (
              <div className="admin-collapsible-panel__body">
                <UiTable minWidth={640}>
                  <thead>
                    <tr>
                      <th>{rtl ? 'رقم الطلب' : 'Order #'}</th>
                      <th>{rtl ? 'المورد' : 'Vendor'}</th>
                      <th>{rtl ? 'العميل' : 'Customer'}</th>
                      <th>{rtl ? 'المبلغ' : 'Amount'}</th>
                      <th className="text-end">{rtl ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="font-semibold">{ord.orderNumber}</td>
                        <td>{rtl ? ord.vendorNameAr || ord.vendorName : ord.vendorName || ord.vendorNameAr}</td>
                        <td>
                          {ord.customerName} · {ord.customerPhone}
                        </td>
                        <td>{Number(ord.totalAmount || 0).toFixed(2)}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/vendors/${ord.user?.id || ord.userId}`)}
                            className="ui-action-btn"
                            title={rtl ? 'عرض المورد' : 'View vendor'}
                          >
                            <Eye size={16} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </UiTable>
              </div>
            ) : null}
          </div>
        ) : null}

        <UiCard toolbar={toolbar} ariaLabel={title}>
          {loading ? (
            <UiTableSkeleton rows={8} cols={7} />
          ) : vendors.length === 0 ? (
            <EmptyState
              title={t('noData')}
              description={
                rtl
                  ? 'لا يوجد موردون بعد. يُسجَّل الموردون عبر تطبيق المورد.'
                  : 'No vendors yet. Vendors register via the vendor app.'
              }
            />
          ) : (
            <>
              <UiTable minWidth={960}>
                <thead>
                  <tr>
                    <th>{rtl ? 'المتجر' : 'Vendor'}</th>
                    <th>{rtl ? 'النوع' : 'Type'}</th>
                    <th>{rtl ? 'الهاتف' : 'Phone'}</th>
                    <th className="hidden md:table-cell">{rtl ? 'المدينة' : 'City'}</th>
                    <th className="hidden sm:table-cell">{rtl ? 'الخدمات' : 'Services'}</th>
                    <th>{rtl ? 'الحالة' : 'Status'}</th>
                    <th className="text-end">{rtl ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => {
                    const name = v.businessName || v.name || '—'
                    return (
                      <tr key={v.id}>
                        <td>
                          <div className="ui-user-cell">
                            <div className="ui-avatar" style={!v.avatar ? { background: avatarGradient(name) } : undefined}>
                              {v.avatar ? (
                                <img src={formatImageSrc(v.avatar)} alt="" />
                              ) : (
                                <Package size={18} color="#fff" aria-hidden />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="ui-user-name">{name}</div>
                              <div className="ui-user-meta">{v.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>{(VENDOR_TYPES[v.vendorType] || {})[language] || v.vendorType}</td>
                        <td dir="ltr" className="text-start">
                          {v.phone || '—'}
                        </td>
                        <td className="hidden md:table-cell">{v.city || '—'}</td>
                        <td className="hidden sm:table-cell">{v._count?.services ?? v._count?.vendorServices ?? 0}</td>
                        <td>
                          <Badge variant={STATUS_VARIANT[v.status] || 'default'}>
                            {STATUS_CHIPS.find((c) => c.value === v.status)?.[language] || v.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="ui-actions flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/vendors/${v.id}`)}
                              className="ui-action-btn"
                              title={rtl ? 'عرض' : 'View'}
                            >
                              <Eye size={16} aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/vendors/${v.id}`)}
                              className="ui-action-btn"
                              title={rtl ? 'تعديل' : 'Edit'}
                            >
                              <Pencil size={16} aria-hidden />
                            </button>
                            {v.status === 'PENDING' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => approveVendor(v.id)}
                                  className="ui-action-btn"
                                  title={rtl ? 'موافقة' : 'Approve'}
                                >
                                  <Check size={16} aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => rejectVendor(v.id)}
                                  className="ui-action-btn ui-action-btn--danger"
                                  title={rtl ? 'رفض' : 'Reject'}
                                >
                                  <X size={16} aria-hidden />
                                </button>
                              </>
                            ) : null}
                            {v.status === 'APPROVED' ? (
                              <button
                                type="button"
                                onClick={() => suspendVendor(v.id)}
                                className="ui-action-btn"
                                title={rtl ? 'إيقاف' : 'Suspend'}
                              >
                                <Ban size={16} aria-hidden />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => deleteVendor(v.id, name)}
                              className="ui-action-btn ui-action-btn--danger"
                              title={rtl ? 'حذف' : 'Delete'}
                            >
                              <Trash2 size={16} aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </UiTable>
              {pagination.totalPages > 1 ? (
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
    </AdminPage>
  )
}

export default Vendors
