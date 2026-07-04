import { adminAuthHeaders, apiOrigin, readAdminUser } from '../utils/adminSession'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { CreditCard, FileText, Settings, Shield, Store, Users } from 'lucide-react'
import AdminPage from '../components/AdminPage'
const tabs = [
  { id: 'profile', icon: Store },
  { id: 'security', icon: Shield },
]

function VendorProfileSettings() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const user = readAdminUser()
  const origin = useMemo(() => apiOrigin(), [])
  const headers = useMemo(() => adminAuthHeaders(), [])

  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    businessNameAr: '',
    description: '',
    address: '',
    country: '',
    city: '',
    area: '',
    googleMapsLink: '',
  })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${origin}/api/mobile/vendor/profile`, { headers })
      const v = res.data.vendor || {}
      setForm({
        name: v.name || '',
        businessName: v.businessName || '',
        businessNameAr: v.businessNameAr || '',
        description: v.description || '',
        address: v.address || '',
        country: v.country || '',
        city: v.city || '',
        area: v.area || '',
        googleMapsLink: v.googleMapsLink || '',
      })
    } catch {
      toast.error(t('vendorSettings.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.patch(`${origin}/api/mobile/vendor/profile`, form, { headers })
      toast.success(t('vendorSettings.profileSaved'))
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || t('vendorSettings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    setPasswordSaving(true)
    try {
      await axios.patch(`${origin}/api/mobile/vendor/profile/password`, pwd, { headers })
      toast.success(t('vendorSettings.passwordSaved'))
      setPwd({ currentPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || t('vendorSettings.passwordFailed'))
    } finally {
      setPasswordSaving(false)
    }
  }

  const quickLinks = [
    { to: '/admin/vendor/wallet', label: t('nav.myWallet'), desc: t('vendorSettings.linkWallet'), icon: CreditCard },
    { to: '/admin/vendor/reports', label: t('nav.myReports'), desc: t('vendorSettings.linkReports'), icon: FileText },
    { to: '/admin/vendor/team', label: t('nav.vendorTeam'), desc: t('vendorSettings.linkTeam'), icon: Users },
  ]

  return (
    <AdminPage title={t('vendorSettings.pageTitle')}>
      <div className="space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
        <div className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-gradient-to-br from-[var(--admin-surface)] to-[var(--admin-bg)] p-6 shadow-[var(--admin-shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]">
                <Settings className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--admin-text)]">{t('vendorSettings.pageTitle')}</h1>
                <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{t('vendorSettings.heroSubtitle')}</p>
                {user?.email ? (
                  <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
                    {t('vendorSettings.signedInAs')}: <span className="font-medium text-[var(--admin-text)]">{user.email}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 transition hover:border-[var(--admin-accent)]/40 hover:shadow-md"
              >
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--admin-accent)]" />
                <div>
                  <p className="font-medium text-[var(--admin-text)] group-hover:text-[var(--admin-accent)]">{item.label}</p>
                  <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1 shadow-sm">
          {tabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition sm:flex-none sm:px-6 ${
                tab === id
                  ? 'bg-[var(--admin-accent)] text-white shadow'
                  : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-bg)] hover:text-[var(--admin-text)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {id === 'profile' ? t('vendorSettings.tabProfile') : t('vendorSettings.tabSecurity')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]" />
          </div>
        ) : (
          <>
            {tab === 'profile' ? (
              <form
                onSubmit={submitProfile}
                className="space-y-5 rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)]"
              >
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">{t('vendorSettings.sectionBusiness')}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelName')}</label>
                    <input className="admin-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelBusinessEn')}</label>
                    <input
                      className="admin-input w-full"
                      value={form.businessName}
                      onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelBusinessAr')}</label>
                    <input
                      className="admin-input w-full"
                      value={form.businessNameAr}
                      onChange={(e) => setForm((f) => ({ ...f, businessNameAr: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelDescription')}</label>
                    <textarea
                      className="admin-input min-h-[100px] w-full"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelAddress')}</label>
                    <input className="admin-input w-full" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelCountry')}</label>
                    <input className="admin-input w-full" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelCity')}</label>
                    <input className="admin-input w-full" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelArea')}</label>
                    <input className="admin-input w-full" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.labelMaps')}</label>
                    <input
                      className="admin-input w-full"
                      value={form.googleMapsLink}
                      onChange={(e) => setForm((f) => ({ ...f, googleMapsLink: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-[10px] bg-[var(--admin-accent)] px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? t('vendorSettings.saving') : t('vendorSettings.saveProfile')}
                </button>
              </form>
            ) : (
              <form
                onSubmit={submitPassword}
                className="max-w-lg space-y-4 rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)]"
              >
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">{t('vendorSettings.sectionPassword')}</h2>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.currentPassword')}</label>
                  <input
                    type="password"
                    className="admin-input w-full"
                    value={pwd.currentPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorSettings.newPassword')}</label>
                  <input
                    type="password"
                    className="admin-input w-full"
                    value={pwd.newPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-6 py-2.5 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface)] disabled:opacity-60"
                >
                  {passwordSaving ? t('vendorSettings.updating') : t('vendorSettings.updatePassword')}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </AdminPage>
  )
}

export default VendorProfileSettings
