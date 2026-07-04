import { API_URL } from '../utils/adminSession'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Shield } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  AdminContent,
  Badge,
  UiCard,
  UiStat,
  UiStats,
  UiChip,
  UiChipGroup,
  UiTableSkeleton,
} from '../design-system'


const ROLE_TONE = { ADMIN: 'indigo', PROVIDER: 'amber', CUSTOMER: 'slate' }

function Roles() {
  const { language, t } = useLanguage()
  const ar = language === 'ar'
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState(null)
  const [rolePermissions, setRolePermissions] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
    fetchStats()
  }, [])

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole)
    }
  }, [selectedRole])

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRoles(response.data.roles || [])
      if (!selectedRole && response.data.roles.length > 0) {
        setSelectedRole(response.data.roles[0].role)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 200 }
      })
      setPermissions(response.data.permissions || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const fetchRolePermissions = async (role) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/roles/${role}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRolePermissions(response.data.permissions || [])
    } catch (error) {
      console.error('Error fetching role permissions:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${API_URL}/roles/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleTogglePermission = async (permissionId) => {
    try {
      const token = localStorage.getItem('admin_token')
      const isAssigned = rolePermissions.some(p => p.id === permissionId)

      if (isAssigned) {
        await axios.delete(
          `${API_URL}/roles/${selectedRole}/permissions/${permissionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        await axios.post(
          `${API_URL}/roles/${selectedRole}/permissions/add`,
          { permissionId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      fetchRolePermissions(selectedRole)
      fetchStats()
    } catch (error) {
      console.error('Error toggling permission:', error)
      toast.error(error.response?.data?.error || 'فشل تحديث الصلاحية')
    }
  }

  const handleAssignAll = async () => {
    if (!window.confirm(`هل تريد تعيين جميع الصلاحيات للدور ${selectedRole}؟`)) return
    try {
      const token = localStorage.getItem('admin_token')
      const allPermissionIds = permissions.map(p => p.id)
      await axios.post(
        `${API_URL}/roles/${selectedRole}/permissions`,
        { permissionIds: allPermissionIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchRolePermissions(selectedRole)
      fetchStats()
    } catch (error) {
      console.error('Error assigning permissions:', error)
      toast.error(error.response?.data?.error || 'فشل تعيين الصلاحيات')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm(`هل تريد إزالة جميع الصلاحيات من الدور ${selectedRole}؟`)) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(
        `${API_URL}/roles/${selectedRole}/permissions`,
        { permissionIds: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchRolePermissions(selectedRole)
      fetchStats()
    } catch (error) {
      console.error('Error clearing permissions:', error)
      toast.error(error.response?.data?.error || 'فشل إزالة الصلاحيات')
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: ar ? 'مدير' : 'Admin',
      PROVIDER: ar ? 'مزود' : 'Provider',
      CUSTOMER: ar ? 'عميل' : 'Customer',
    }
    return labels[role] || role
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {})

  const title = ar ? 'الأدوار والصلاحيات' : 'Roles & permissions'
  const subtitle = ar ? 'تعيين الصلاحيات لكل دور في النظام' : 'Assign permissions per system role'

  if (loading) {
    return (
      <AdminPage title={title} subtitle={subtitle}>
        <AdminContent>
          <UiTableSkeleton rows={6} />
        </AdminContent>
      </AdminPage>
    )
  }

  const statsRow =
    stats?.roles ? (
      <UiStats>
        {Object.entries(stats.roles).map(([role, data]) => (
          <UiStat
            key={role}
            icon={Shield}
            iconTone={ROLE_TONE[role] || 'slate'}
            value={data.permissions}
            label={`${getRoleLabel(role)} · ${data.users} ${ar ? 'مستخدم' : 'users'}`}
          />
        ))}
      </UiStats>
    ) : null

  const roleChips = (
    <UiChipGroup ariaLabel={ar ? 'اختر الدور' : 'Select role'}>
      {roles.map((role) => (
        <UiChip
          key={role.role}
          active={selectedRole === role.role}
          onClick={() => setSelectedRole(role.role)}
        >
          {getRoleLabel(role.role)} ({role.permissionCount})
        </UiChip>
      ))}
    </UiChipGroup>
  )

  const permissionsToolbar = selectedRole ? (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-[var(--admin-text)]">
        {ar ? 'صلاحيات' : 'Permissions'}: {getRoleLabel(selectedRole)}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleAssignAll} className="ads-btn ads-btn-primary">
          {ar ? 'تعيين الكل' : 'Assign all'}
        </button>
        <button type="button" onClick={handleClearAll} className="ads-btn ads-btn-danger">
          {ar ? 'إزالة الكل' : 'Clear all'}
        </button>
      </div>
    </div>
  ) : null

  return (
    <AdminPage
      title={title}
      subtitle={subtitle}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.roles') },
      ]}
    >
      <AdminContent>
        {statsRow}
        <UiCard ariaLabel={ar ? 'الأدوار' : 'Roles'}>{roleChips}</UiCard>
        {selectedRole ? (
          <UiCard toolbar={permissionsToolbar} ariaLabel={getRoleLabel(selectedRole)}>
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                <div key={resource} className="rounded-xl border border-[var(--admin-border)] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="info">{resource}</Badge>
                    <span className="text-xs text-[var(--admin-text-muted)]">
                      {resourcePermissions.length} {ar ? 'صلاحية' : 'permissions'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {resourcePermissions.map((permission) => {
                      const isAssigned = rolePermissions.some((p) => p.id === permission.id)
                      return (
                        <label
                          key={permission.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                            isAssigned
                              ? 'border-emerald-300 bg-emerald-50/80'
                              : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--admin-border-strong)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => handleTogglePermission(permission.id)}
                            className="mt-0.5 h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-[var(--admin-text)]">{permission.action}</div>
                            {permission.description ? (
                              <div className="mt-0.5 text-xs text-[var(--admin-text-muted)]">{permission.description}</div>
                            ) : null}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </UiCard>
        ) : null}
      </AdminContent>
    </AdminPage>
  )
}

export default Roles

