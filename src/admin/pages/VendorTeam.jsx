import { adminAuthHeaders, apiOrigin, hasPermission, readAdminUser } from '../utils/adminSession'
import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { Plus, RefreshCw, Trash2, Users } from 'lucide-react'
import AdminPage from '../components/AdminPage'
const SLAUGHTER = 'SLAUGHTER_PROVIDER'
const VENUE = 'VENUE_PROVIDER'

function emptyFormForUser(user) {
  const slaughter = user?.vendorType === SLAUGHTER
  const venue = user?.vendorType === VENUE
  return {
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'STAFF',
    canViewSlaughterOrders: slaughter,
    canUpdateSlaughterOrderStatus: false,
    canIssueInvoices: slaughter,
    canManageTeam: false,
    canViewVenueBookings: venue,
    canUpdateBookingStatus: false,
    canIssueVenueInvoices: false,
    canManageVenueTeam: false,
  }
}

export default function VendorTeam() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const user = readAdminUser()
  const canEditTeam =
    !user?.isVendorEmployee ||
    user?.vendorEmployeeRole === 'MANAGER' ||
    hasPermission(user, 'slaughter_team', 'manage') ||
    hasPermission(user, 'venue_team', 'manage')
  const showSlaughterPerms = user?.vendorType === SLAUGHTER
  const showVenuePerms = user?.vendorType === VENUE

  const origin = useMemo(() => apiOrigin(), [])
  const headers = useMemo(() => adminAuthHeaders(), [])

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(() => emptyFormForUser(user))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${origin}/api/mobile/vendor/team`, { headers })
      setEmployees(data.employees || [])
    } catch {
      toast.error(t('slaughterTeam.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [headers, origin, t])

  useEffect(() => {
    load()
  }, [load])

  const payloadForCreate = () => {
    if (showSlaughterPerms) return form
    if (showVenuePerms) return form
    return {
      ...form,
      canViewSlaughterOrders: false,
      canUpdateSlaughterOrderStatus: false,
      canIssueInvoices: false,
      canManageTeam: !!form.canManageTeam,
      canViewVenueBookings: false,
      canUpdateBookingStatus: false,
      canIssueVenueInvoices: false,
      canManageVenueTeam: false,
    }
  }

  const create = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${origin}/api/mobile/vendor/team`, payloadForCreate(), { headers })
      toast.success(t('slaughterTeam.created'))
      setForm(emptyFormForUser(user))
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    }
  }

  const remove = async (id) => {
    if (!window.confirm(t('confirm.delete_text'))) return
    try {
      await axios.delete(`${origin}/api/mobile/vendor/team/${id}`, { headers })
      toast.success(t('messages.deleted'))
      load()
    } catch {
      toast.error(t('messages.error'))
    }
  }

  return (
    <AdminPage title={t('vendorTeam.pageTitle')}>
      <div className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <Users className="h-5 w-5 shrink-0 text-[var(--admin-accent)]" />
          <p className="text-sm text-[var(--admin-text-muted)]">{t('vendorTeam.subtitle')}</p>
        </div>

        {canEditTeam ? (
          <form
            onSubmit={create}
            className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)]"
          >
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-[var(--admin-text)]">
              <Plus className="h-5 w-5" />
              {t('slaughterTeam.add')}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <input
                required
                className="admin-input"
                placeholder={t('slaughterTeam.email')}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <input
                required
                type="password"
                className="admin-input"
                placeholder={t('slaughterTeam.password')}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <input
                required
                className="admin-input"
                placeholder={t('slaughterTeam.name')}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="admin-input"
                placeholder={t('slaughterTeam.phone')}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <select className="admin-input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="MANAGER">{t('slaughterTeam.roleManager')}</option>
                <option value="STAFF">{t('slaughterTeam.roleStaff')}</option>
                <option value="VIEWER">{t('slaughterTeam.roleViewer')}</option>
              </select>
            </div>
            {showSlaughterPerms ? (
              <div className="mt-4 grid gap-2 text-sm text-[var(--admin-text)] md:grid-cols-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.canViewSlaughterOrders}
                    onChange={(e) => setForm((f) => ({ ...f, canViewSlaughterOrders: e.target.checked }))}
                  />
                  {t('slaughterTeam.permViewOrders')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.canUpdateSlaughterOrderStatus}
                    onChange={(e) => setForm((f) => ({ ...f, canUpdateSlaughterOrderStatus: e.target.checked }))}
                  />
                  {t('slaughterTeam.permUpdateStatus')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.canIssueInvoices}
                    onChange={(e) => setForm((f) => ({ ...f, canIssueInvoices: e.target.checked }))}
                  />
                  {t('slaughterTeam.permInvoices')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.canManageTeam}
                    onChange={(e) => setForm((f) => ({ ...f, canManageTeam: e.target.checked }))}
                  />
                  {t('slaughterTeam.permTeam')}
                </label>
              </div>
            ) : showVenuePerms ? (
              <div className="mt-4 grid gap-2 text-sm text-[var(--admin-text)] md:grid-cols-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.canViewVenueBookings}
                    onChange={(e) => setForm((f) => ({ ...f, canViewVenueBookings: e.target.checked }))}
                  />
                  {t('vendorTeam.venuePermViewBookings')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.canUpdateBookingStatus}
                    onChange={(e) => setForm((f) => ({ ...f, canUpdateBookingStatus: e.target.checked }))}
                  />
                  {t('vendorTeam.venuePermUpdateBookingStatus')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.canIssueVenueInvoices}
                    onChange={(e) => setForm((f) => ({ ...f, canIssueVenueInvoices: e.target.checked }))}
                  />
                  {t('vendorTeam.venuePermIssueInvoices')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.canManageVenueTeam}
                    onChange={(e) => setForm((f) => ({ ...f, canManageVenueTeam: e.target.checked }))}
                  />
                  {t('vendorTeam.venuePermManageTeam')}
                </label>
              </div>
            ) : (
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
                  <input
                    type="checkbox"
                    checked={form.canManageTeam}
                    onChange={(e) => setForm((f) => ({ ...f, canManageTeam: e.target.checked }))}
                  />
                  {t('vendorTeam.canManageTeamPortal')}
                </label>
                <p className="mt-2 text-xs text-[var(--admin-text-muted)]">{t('vendorTeam.nonSlaughterHint')}</p>
              </div>
            )}
            <button type="submit" className="mt-4 rounded-[10px] bg-[var(--admin-accent)] px-6 py-2 text-sm font-medium text-white">
              {t('slaughterTeam.saveMember')}
            </button>
          </form>
        ) : (
          <p className="text-sm text-amber-700">{t('slaughterTeam.staffNoForm')}</p>
        )}

        <div className="flex justify-end">
          <button type="button" className="admin-toolbar-btn" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            {t('slaughterOrders.refresh')}
          </button>
        </div>

        <div className="overflow-hidden rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-card)]">
          {loading ? (
            <div className="p-10 text-center text-[var(--admin-text-muted)]">{t('slaughterOrders.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ui-table min-w-full text-sm">
                <thead className="bg-[var(--admin-bg)] text-[var(--admin-text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('slaughterTeam.name')}</th>
                    <th className="px-4 py-3 font-semibold">{t('slaughterTeam.email')}</th>
                    <th className="px-4 py-3 font-semibold">{t('slaughterTeam.role')}</th>
                    <th className="px-4 py-3 font-semibold">{t('slaughterTeam.flags')}</th>
                    {canEditTeam ? <th className="px-4 py-3 font-semibold">{t('slaughterTeam.actions')}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((em) => (
                    <tr key={em.id} className="border-t border-[var(--admin-border)] text-[var(--admin-text)]">
                      <td className="px-4 py-3 font-medium">{em.name}</td>
                      <td className="px-4 py-3 text-xs">{em.email}</td>
                      <td className="px-4 py-3">{em.role}</td>
                      <td className="px-4 py-3 text-xs text-[var(--admin-text-muted)]">
                        {[em.canViewSlaughterOrders && 'V',
                          em.canUpdateSlaughterOrderStatus && 'U',
                          em.canIssueInvoices && 'I',
                          em.canManageTeam && 'T',
                          em.canViewVenueBookings && 'v',
                          em.canUpdateBookingStatus && 'u',
                          em.canIssueVenueInvoices && 'i',
                          em.canManageVenueTeam && 't']
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </td>
                      {!canEditTeam ? null : (
                        <td className="px-4 py-3">
                          <button type="button" className="text-rose-600 hover:underline" onClick={() => remove(em.id)}>
                            <Trash2 className="inline h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  )
}
