import { API_URL } from '../utils/adminSession'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { KeyRound, Plus, Pencil, Trash2, X } from 'lucide-react'
import ModernListPage from '../components/ModernListPage'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { Badge, SearchInput, UiStat, UiStats } from '../design-system'


function Permissions() {
  const { language, t } = useLanguage()
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterResource, setFilterResource] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPermission, setEditingPermission] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: ''
  })

  useEffect(() => {
    fetchPermissions()
  }, [search, filterResource, filterAction])

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          resource: filterResource || undefined,
          action: filterAction || undefined,
          limit: 100
        }
      })
      setPermissions(response.data.permissions || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('admin_token')
      if (editingPermission) {
        await axios.patch(
          `${API_URL}/permissions/${editingPermission.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        await axios.post(
          `${API_URL}/permissions`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      fetchPermissions()
      setShowForm(false)
      setEditingPermission(null)
      setFormData({ name: '', description: '', resource: '', action: '' })
    } catch (error) {
      console.error('Error saving permission:', error)
      toast.error(error.response?.data?.error || t('saveFailed'))
    }
  }

  const handleEdit = (permission) => {
    setEditingPermission(permission)
    setFormData({
      name: permission.name,
      description: permission.description || '',
      resource: permission.resource,
      action: permission.action
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/permissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPermissions()
    } catch (error) {
      console.error('Error deleting permission:', error)
      toast.error(error.response?.data?.error || t('deleteFailed'))
    }
  }

  const resources = [...new Set(permissions.map(p => p.resource))]
  const actions = [...new Set(permissions.map(p => p.action))]

  const ar = language === 'ar'
  const title = t('permissions', { ar: 'الصلاحيات', en: 'Permissions' })
  const subtitle = ar ? 'إدارة صلاحيات الوصول في النظام' : 'Manage system access permissions'

  const toolbar = (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
      <div className="md:col-span-1">
        <SearchInput
          placeholder={t('searchPermissions', { ar: 'ابحث في الصلاحيات…', en: 'Search permissions…' })}
          onDebouncedChange={setSearch}
        />
      </div>
      <div>
        <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} className="admin-input" dir={language}>
          <option value="">{t('allResources', { ar: 'جميع الموارد', en: 'All resources' })}</option>
          {resources.map((resource) => (
            <option key={resource} value={resource}>
              {resource}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="admin-input" dir={language}>
          <option value="">{t('allActions', { ar: 'جميع الإجراءات', en: 'All actions' })}</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  return (
    <>
      <ModernListPage
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: t('nav.dashboard'), path: '/admin/dashboard' },
          { label: t('nav.permissions') },
        ]}
        action={
          <button
            type="button"
            onClick={() => {
              setEditingPermission(null)
              setFormData({ name: '', description: '', resource: '', action: '' })
              setShowForm(true)
            }}
            className="ads-btn ads-btn-primary gap-2"
          >
            <Plus size={18} aria-hidden />
            {t('addPermission')}
          </button>
        }
        stats={
          <UiStats>
            <UiStat icon={KeyRound} iconTone="indigo" value={permissions.length} label={t('permission')} />
            <UiStat icon={KeyRound} iconTone="slate" value={resources.length} label={t('resource', { ar: 'موارد', en: 'Resources' })} />
          </UiStats>
        }
        toolbar={toolbar}
        loading={loading}
        empty={!loading && permissions.length === 0}
        emptyTitle={t('noData')}
        ariaLabel={title}
      >
        <div className="overflow-x-auto">
          <table className="ui-table w-full min-w-[720px]">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('description')}</th>
                <th>{t('resource', { ar: 'المورد', en: 'Resource' })}</th>
                <th>{t('action', { ar: 'الإجراء', en: 'Action' })}</th>
                <th>{t('rolesCount', { ar: 'الأدوار', en: 'Roles' })}</th>
                <th className="text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.id}>
                  <td className="font-medium text-[var(--admin-text)]">{permission.name}</td>
                  <td className="text-[var(--admin-text-muted)]">{permission.description || '—'}</td>
                  <td>
                    <Badge variant="info">{permission.resource}</Badge>
                  </td>
                  <td>
                    <Badge variant="success">{permission.action}</Badge>
                  </td>
                  <td>{permission._count?.rolePermissions || 0}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(permission)}
                        className="ads-btn ads-btn-icon ads-btn-subtle"
                        title={t('edit')}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(permission.id)}
                        className="ads-btn ads-btn-icon ads-btn-subtle text-red-600"
                        title={t('delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModernListPage>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-dropdown)]"
            style={{ borderRadius: 'var(--admin-radius-modal)' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--admin-text)]">
                {editingPermission ? t('editPermission') : t('addNewPermission', { ar: 'صلاحية جديدة', en: 'New permission' })}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingPermission(null)
                  setFormData({ name: '', description: '', resource: '', action: '' })
                }}
                className="ads-btn ads-btn-icon ads-btn-subtle"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{t('name')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input"
                  dir={language}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{t('description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="admin-input min-h-[88px]"
                  dir={language}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">
                  {t('resource', { ar: 'المورد', en: 'Resource' })} *
                </label>
                <input
                  type="text"
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  className="admin-input"
                  dir={language}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">
                  {t('action', { ar: 'الإجراء', en: 'Action' })} *
                </label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="admin-input"
                  dir={language}
                  required
                >
                  <option value="">{t('selectAction', { ar: 'اختر الإجراء', en: 'Select action' })}</option>
                  <option value="read">read</option>
                  <option value="create">create</option>
                  <option value="update">update</option>
                  <option value="delete">delete</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="ads-btn ads-btn-primary flex-1">
                  {editingPermission ? t('update') : t('add')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingPermission(null)
                    setFormData({ name: '', description: '', resource: '', action: '' })
                  }}
                  className="ads-btn ads-btn-subtle flex-1"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Permissions

