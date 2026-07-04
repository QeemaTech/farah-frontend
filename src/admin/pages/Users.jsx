import { API_URL } from '../utils/adminSession'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Plus, FileBarChart, Pencil, Trash2, UserCheck, UserX, Users as UsersIcon, Shield, Sparkles } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatImageSrc } from '../../utils/imageUtils'
import { AdminContent, Badge, SearchInput, EmptyState } from '../design-system'

const ROLE_VARIANT = {
  ADMIN: 'info',
  PROVIDER: 'warning',
  CUSTOMER: 'default',
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #ec4899, #a855f7)',
]

function avatarGradient(seed = '') {
  let n = 0
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i)
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length]
}

const ROLE_FILTERS = [
  { value: '', key: 'allRoles', ar: 'الكل', en: 'All' },
  { value: 'ADMIN', key: 'admin' },
  { value: 'PROVIDER', key: 'provider', ar: 'مزود', en: 'Provider' },
  { value: 'CUSTOMER', key: 'customer' },
]

const USERS_LIST_PATH = '/admin/users'
const CUSTOMERS_LIST_PATH = '/admin/users/customers'

function Users({ customersOnly = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isCustomersPage =
    customersOnly || location.pathname === CUSTOMERS_LIST_PATH || location.pathname.startsWith(`${CUSTOMERS_LIST_PATH}/`)

  const { language, t } = useLanguage()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState(() => (isCustomersPage ? 'CUSTOMER' : ''))
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
    location: '',
    locationAr: '',
    isActive: true,
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 20,
    totalPages: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [search, filterRole, pagination.currentPage])

  useEffect(() => {
    setFilterRole(isCustomersPage ? 'CUSTOMER' : '')
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }, [isCustomersPage, location.pathname])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          role: filterRole || undefined,
          limit: pagination.limit,
          offset,
        },
      })
      setUsers(response.data.users || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit),
      }))
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(t('loadFailed', { ar: 'فشل تحميل المستخدمين', en: 'Failed to load users' }))
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('admin_token')

      if (editingUser) {
        await axios.patch(`${API_URL}/admin/users/${editingUser.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(t('userUpdated', { ar: 'تم تحديث المستخدم بنجاح', en: 'User updated successfully' }))
      } else {
        await axios.post(`${API_URL}/admin/users`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(t('userCreated', { ar: 'تم إنشاء المستخدم بنجاح', en: 'User created successfully' }))
      }

      setShowForm(false)
      setEditingUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(error.response?.data?.error || t('updateFailed'))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      email: '',
      phone: '',
      password: '',
      role: 'CUSTOMER',
      location: '',
      locationAr: '',
      isActive: true,
    })
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      nameAr: user.nameAr || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || 'CUSTOMER',
      location: user.location || '',
      locationAr: user.locationAr || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
    })
    setShowForm(true)
  }

  const toggleUserStatus = async (id, isActive) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${API_URL}/admin/users/${id}/status`,
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error(error.response?.data?.error || t('updateFailed'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error.response?.data?.error || t('deleteFailed'))
    }
  }

  const displayName = (user) =>
    language === 'ar' ? user.nameAr || user.name : user.name || user.nameAr

  const displayLocation = (user) =>
    language === 'ar' ? user.locationAr || user.location || '—' : user.location || user.locationAr || '—'

  const roleLabel = (role) => {
    if (role === 'PROVIDER') return language === 'ar' ? 'مزود' : 'Provider'
    return t(role?.toLowerCase() || 'customer')
  }

  const openAddForm = () => {
    setEditingUser(null)
    resetForm()
    setShowForm(true)
  }

  const activeOnPage = useMemo(() => users.filter((u) => u.isActive).length, [users])
  const adminsOnPage = useMemo(() => users.filter((u) => u.role === 'ADMIN').length, [users])

  const headerActions = useMemo(
    () => (
      <>
        <button type="button" onClick={openAddForm} className="ads-btn ads-btn-primary gap-2">
          <Plus size={18} aria-hidden />
          {t('addUser', { ar: 'إضافة مستخدم', en: 'Add user' })}
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/reports?generate=users')}
          className="ads-btn ads-btn-subtle gap-2"
        >
          <FileBarChart size={18} aria-hidden />
          {t('report')}
        </button>
      </>
    ),
    [navigate, t],
  )

  const setRoleFilter = (value) => {
    if (value === 'CUSTOMER') {
      if (!isCustomersPage) {
        navigate(CUSTOMERS_LIST_PATH)
        return
      }
    } else if (isCustomersPage) {
      navigate(USERS_LIST_PATH)
      return
    }
    setFilterRole(value)
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const pageTitle = isCustomersPage
    ? t('nav.customers', { ar: 'العملاء', en: 'Customers' })
    : t('users.title', { ar: 'المستخدمون', en: 'Users' })

  return (
    <AdminPage
      title={pageTitle}
      subtitle={t('usersSubtitle', {
        ar: 'إدارة حسابات العملاء والمزودين والمسؤولين',
        en: 'Manage customer, provider, and admin accounts',
      })}
      breadcrumbs={[
        { label: t('nav.dashboard', { ar: 'الرئيسية', en: 'Home' }), path: '/admin/dashboard' },
        { label: pageTitle },
      ]}
      action={headerActions}
    >
      <AdminContent className="gap-5">
        <div className="ui-stats">
          <div className="ui-stat">
            <div className="ui-stat__icon ui-stat__icon--indigo">
              <UsersIcon size={22} />
            </div>
            <div>
              <div className="ui-stat__value">{pagination.total}</div>
              <div className="ui-stat__label">{t('totalUsers', { ar: 'إجمالي المستخدمين', en: 'Total users' })}</div>
            </div>
          </div>
          <div className="ui-stat">
            <div className="ui-stat__icon ui-stat__icon--emerald">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="ui-stat__value">{activeOnPage}</div>
              <div className="ui-stat__label">{t('activeOnPage', { ar: 'نشط في هذه الصفحة', en: 'Active on this page' })}</div>
            </div>
          </div>
          <div className="ui-stat">
            <div className="ui-stat__icon ui-stat__icon--amber">
              <Shield size={22} />
            </div>
            <div>
              <div className="ui-stat__value">{adminsOnPage}</div>
              <div className="ui-stat__label">{t('adminsOnPage', { ar: 'مسؤولون في الصفحة', en: 'Admins on page' })}</div>
            </div>
          </div>
        </div>

        <section className="ui-card" aria-label={pageTitle}>
          <div className="ui-card__toolbar">
            <div className="ui-search">
              <SearchInput
                placeholder={t('searchUsers', {
                  ar: 'ابحث بالاسم، البريد، أو الهاتف...',
                  en: 'Search by name, email, or phone...',
                })}
                onDebouncedChange={(v) => {
                  setSearch(v)
                  setPagination((prev) => ({ ...prev, currentPage: 1 }))
                }}
              />
            </div>
            <div className="ui-chips" role="group" aria-label={t('role')}>
              {(isCustomersPage
                ? ROLE_FILTERS.filter((f) => f.value === 'CUSTOMER' || f.value === '')
                : ROLE_FILTERS
              ).map((f) => {
                const label =
                  f.ar && f.en
                    ? language === 'ar'
                      ? f.ar
                      : f.en
                    : t(f.key, { ar: f.ar, en: f.en })
                return (
                  <button
                    key={f.value || 'all'}
                    type="button"
                    className={`ui-chip ${filterRole === f.value ? 'ui-chip--active' : ''}`}
                    onClick={() => setRoleFilter(f.value)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="ui-skeleton-row">
                      <td colSpan={7}>
                        <div className="ui-skeleton-bar" style={{ width: `${55 + (i % 4) * 8}%` }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              title={t('noData')}
              description={t('searchUsers', {
                ar: 'جرّب تغيير البحث أو الفلتر',
                en: 'Try a different search or filter',
              })}
            />
          ) : (
            <>
              <div className="ui-table-wrap">
                <table className="ui-table ui-table--people">
                  <thead>
                    <tr>
                      <th className="ui-table-col--name">{t('name')}</th>
                      <th className="hidden md:table-cell">{t('email')}</th>
                      <th>{t('phone')}</th>
                      <th>{t('role')}</th>
                      <th className="hidden lg:table-cell">{t('location')}</th>
                      <th className="hidden sm:table-cell">{t('status')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const name = displayName(user) || '—'
                      return (
                        <tr key={user.id}>
                          <td className="ui-table-cell--user">
                            <div className="ui-user-cell">
                              <div
                                className="ui-avatar"
                                style={!user.avatar ? { background: avatarGradient(name) } : undefined}
                              >
                                {user.avatar ? (
                                  <img src={formatImageSrc(user.avatar)} alt="" />
                                ) : (
                                  (name !== '—' ? name : 'U').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="ui-user-name">{name}</div>
                                {user.email ? (
                                  <div className="ui-user-meta md:hidden">{user.email}</div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell">
                            <span style={{ color: 'var(--admin-text-muted)' }}>{user.email || '—'}</span>
                          </td>
                          <td>{user.phone || '—'}</td>
                          <td>
                            <Badge variant={ROLE_VARIANT[user.role] || 'default'}>{roleLabel(user.role)}</Badge>
                          </td>
                          <td className="hidden lg:table-cell">
                            <span style={{ color: 'var(--admin-text-muted)' }}>{displayLocation(user)}</span>
                          </td>
                          <td className="hidden sm:table-cell">
                            <Badge variant={user.isActive ? 'success' : 'danger'}>
                              {user.isActive ? t('active') : t('inactive')}
                            </Badge>
                          </td>
                          <td>
                            <div className="ui-actions">
                              <button
                                type="button"
                                onClick={() => handleEdit(user)}
                                className="ui-action-btn"
                                title={t('edit')}
                              >
                                <Pencil size={16} aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(user.id, user.isActive)}
                                className="ui-action-btn"
                                title={user.isActive ? t('deactivate') : t('activate')}
                              >
                                {user.isActive ? <UserX size={16} aria-hidden /> : <UserCheck size={16} aria-hidden />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(user.id)}
                                className="ui-action-btn ui-action-btn--danger"
                                title={t('delete')}
                              >
                                <Trash2 size={16} aria-hidden />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                total={pagination.total}
                limit={pagination.limit}
              />
            </>
          )}
        </section>
      </AdminContent>

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingUser(null)
          resetForm()
        }}
        title={
          editingUser
            ? t('editUser', { ar: 'تعديل مستخدم', en: 'Edit user' })
            : t('addUser', { ar: 'إضافة مستخدم', en: 'Add user' })
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
              {t('name', { ar: 'الاسم (إنجليزي)', en: 'Name (English)' })} *
            </label>
            <input
              type="text"
              className="admin-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              dir={language}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
              {t('nameAr', { ar: 'الاسم (عربي)', en: 'Name (Arabic)' })}
            </label>
            <input
              type="text"
              className="admin-input"
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              dir="rtl"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">{t('email')}</label>
            <input
              type="email"
              className="admin-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              dir={language}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">{t('phone')} *</label>
            <input
              type="tel"
              className="admin-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              dir={language}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
              {t('location', { ar: 'الموقع (إنجليزي)', en: 'Location (English)' })}
            </label>
            <input
              type="text"
              className="admin-input"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              dir={language}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
              {t('locationAr', { ar: 'الموقع (عربي)', en: 'Location (Arabic)' })}
            </label>
            <input
              type="text"
              className="admin-input"
              value={formData.locationAr}
              onChange={(e) => setFormData({ ...formData, locationAr: e.target.value })}
              dir="rtl"
            />
          </div>
          {!editingUser && (
            <div className="span-2">
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t('password', { ar: 'كلمة المرور', en: 'Password' })} *
              </label>
              <input
                type="password"
                className="admin-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">{t('role')}</label>
            <select
              className="admin-input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              dir={language}
            >
              <option value="CUSTOMER">{t('customer')}</option>
              <option value="PROVIDER">{language === 'ar' ? 'مزود' : 'Provider'}</option>
              <option value="ADMIN">{t('admin')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="user-active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded accent-[var(--admin-accent)]"
            />
            <label htmlFor="user-active" className="cursor-pointer text-sm font-medium">
              {t('active')}
            </label>
          </div>
          <div className="span-2 flex gap-3 border-t border-[var(--admin-border)] pt-5">
            <button type="submit" className="ads-btn ads-btn-primary flex-1">
              {t('save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingUser(null)
                resetForm()
              }}
              className="ads-btn ads-btn-subtle flex-1"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </Modal>
    </AdminPage>
  )
}

export default Users
