import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Notifications from './Notifications'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import ThemeToggle from '../../components/ui/ThemeToggle'
import Avatar from '../../components/ui/Avatar'
import { Target, Menu, X, LogOut, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react'
import { filterAdminNav, NAV_SECTION_ORDER, NAV_SECTION_LABELS } from '../../components/layout/navConfig'
import AdminSidebarNav from './AdminSidebarNav'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { readAdminUser, isFullAdminUser, getAdminToken, API_URL, getPortalHomePath, getPortalLoginPath } from '../utils/adminSession'
import { formatImageSrc } from '../../utils/imageUtils'
import { useAdminPageContext } from '../contexts/AdminPageContext'
import { resetAdminSessionBootstrap } from './AdminRoute'
import { PoweredByFooter } from '../../components/ui/PoweredByFooter'

/** Module-level cache so layout data survives route changes (single AdminShell instance). */
const layoutBootstrap = { fetched: false, fetching: false }

function AdminLayout({ children }) {
  const { meta } = useAdminPageContext()
  const {
    title,
    subtitle,
    breadcrumbs = [],
    action,
    pageLoading = false,
    className = '',
    showPageHeader = true,
  } = meta
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [brand, setBrand] = useState({ dashboardLogo: null, appLogo: null, appName: '', appNameAr: '' })
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const userDropdownRef = useRef(null)
  const fileInputRef = useRef(null)

  const [user, setUser] = useState(() => readAdminUser())

  const rtl = i18n.language === 'ar'

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
        setMobileMenuOpen(false)
      }
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (layoutBootstrap.fetched) return
    if (layoutBootstrap.fetching) return

    const fetchData = async () => {
      layoutBootstrap.fetching = true
      try {
        const token = getAdminToken()
        if (!token) return
        const storedUser = readAdminUser()
        const isVendorAuth = storedUser?.authSource === 'vendor'

        const logoPromise = axios.get(`${API_URL}/settings`, { timeout: 5000 })
        const mePromise = isVendorAuth
          ? axios
              .get(`${API_URL}/mobile/vendor/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 8000,
              })
              .catch(() => null)
          : axios
              .get(`${API_URL}/auth/admin/me`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 8000,
              })
              .catch((err) => {
                if (err.response?.status === 401 || err.response?.status === 403) {
                  localStorage.removeItem('admin_token')
                  localStorage.removeItem('admin_user')
                  window.location.href = getPortalLoginPath(window.location.pathname)
                }
                return null
              })

        const [logoResponse, meResponse] = await Promise.all([logoPromise, mePromise])
        const s = logoResponse.data.settings
        if (s) {
          setBrand({
            dashboardLogo: s.dashboardLogo || null,
            appLogo: s.appLogo || null,
            appName: s.appName || '',
            appNameAr: s.appNameAr || '',
          })
        }
        if (isVendorAuth && meResponse?.data) {
          const v = meResponse.data.vendor || meResponse.data
          const merged = {
            ...storedUser,
            ...v,
            id: v.id || storedUser?.id,
            name: v.name || v.businessName || storedUser?.name,
            role: 'PROVIDER',
            vendorType: v.vendorType ?? storedUser?.vendorType ?? null,
            vendorStatus: v.status ?? storedUser?.vendorStatus ?? null,
            isFullAdmin: false,
            authSource: 'vendor',
          }
          setUser(merged)
          setProfileImage(merged.avatar)
          localStorage.setItem('admin_user', JSON.stringify(merged))
        } else if (meResponse?.data?.success && meResponse.data.user) {
          const merged = {
            ...meResponse.data.user,
            vendorType: meResponse.data.vendorType ?? null,
            vendorStatus: meResponse.data.vendorStatus ?? null,
            permissions: meResponse.data.permissions ?? null,
            isFullAdmin: !!meResponse.data.isFullAdmin,
            authSource: 'admin',
          }
          setUser(merged)
          setProfileImage(merged.avatar)
          localStorage.setItem('admin_user', JSON.stringify(merged))
          if (isFullAdminUser(merged)) {
            const profileResponse = await axios
              .get(`${API_URL}/admin/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000,
              })
              .catch(() => null)
            if (profileResponse?.data?.user) {
              const u2 = { ...merged, ...profileResponse.data.user, isFullAdmin: true, authSource: 'admin' }
              setUser(u2)
              setProfileImage(u2.avatar)
              localStorage.setItem('admin_user', JSON.stringify(u2))
            }
          }
        } else if (readAdminUser()?.avatar) {
          setProfileImage(readAdminUser().avatar)
        }
        layoutBootstrap.fetched = true
      } catch {
        layoutBootstrap.fetched = true
      } finally {
        layoutBootstrap.fetching = false
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const onDoc = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false)
      }
    }
    if (userDropdownOpen) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [userDropdownOpen])

  useEffect(() => {
    document.body.classList.add('admin-dashboard')
    document.documentElement.style.height = '100%'
    document.body.style.height = '100%'
    const root = document.getElementById('root')
    root?.style.setProperty('display', 'block')
    root?.style.setProperty('height', '100vh')
    root?.style.setProperty('width', '100%')
    return () => document.body.classList.remove('admin-dashboard')
  }, [])

  const handleImageUpload = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('messages.notImage'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('messages.imageTooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      const result = reader.result
      if (result && typeof result === 'string') {
        try {
          const token = localStorage.getItem('admin_token')
          const response = await axios.patch(
            `${API_URL}/admin/profile`,
            { avatar: result },
            { headers: { Authorization: `Bearer ${token}` } },
          )
          if (response.data.user) {
            setUser(response.data.user)
            setProfileImage(response.data.user.avatar)
            localStorage.setItem('admin_user', JSON.stringify(response.data.user))
            toast.success(t('messages.imageUpdated'))
            setUserDropdownOpen(false)
          }
        } catch {
          toast.error(t('messages.imageFailed'))
        }
      }
    }
    reader.onerror = () => toast.error(t('messages.readImageFailed'))
    reader.readAsDataURL(file)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    layoutBootstrap.fetched = false
    layoutBootstrap.fetching = false
    resetAdminSessionBootstrap()
    navigate(getPortalLoginPath(location.pathname))
  }

  const filteredMenu = useMemo(
    () => filterAdminNav(user || readAdminUser()),
    [t, i18n.language, user]
  )

  const navSections = useMemo(() => {
    const bySection = {}
    filteredMenu.forEach((item) => {
      const key = item.section || 'core'
      if (!bySection[key]) bySection[key] = []
      bySection[key].push(item)
    })
    return NAV_SECTION_ORDER.filter((id) => bySection[id]?.length).map((id) => ({
      id,
      labelKey: NAV_SECTION_LABELS[id],
      items: bySection[id],
    }))
  }, [filteredMenu])

  const sidebarWidth = sidebarOpen ? 272 : 76
  const displayLogo = brand.dashboardLogo || brand.appLogo
  const logoSrc = formatImageSrc(displayLogo)
  const brandName = rtl ? brand.appNameAr || brand.appName || t('app.name') : brand.appName || brand.appNameAr || t('app.name')

  const closeMobileNav = () => {
    if (isMobile) {
      setMobileMenuOpen(false)
      setSidebarOpen(false)
    }
  }

  const userAvatarSrc = formatImageSrc(profileImage || user?.avatar)

  return (
    <div
      className="admin-dashboard-scope flex h-screen w-full overflow-hidden bg-[var(--admin-bg)]"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      {isMobile && mobileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label={t('layout.closeMenu')}
          onClick={() => {
            setMobileMenuOpen(false)
            setSidebarOpen(false)
          }}
        />
      ) : null}

      <aside
        className={`top-0 z-50 flex h-full flex-col border-[var(--admin-sidebar-border)] text-[var(--admin-sidebar-fg-strong)] transition-[width,transform] duration-300 lg:relative lg:translate-x-0 ${
          isMobile ? 'shadow-[var(--elevation-raised)]' : 'border-e'
        } ${
          isMobile ? 'fixed' : 'relative'
        } ${
          isMobile
            ? rtl
              ? mobileMenuOpen
                ? 'end-0 translate-x-0'
                : 'end-0 translate-x-full'
              : mobileMenuOpen
                ? 'start-0 translate-x-0'
                : 'start-0 -translate-x-full'
            : ''
        }`}
        style={{ width: sidebarWidth, backgroundColor: 'var(--admin-sidebar)' }}
      >
        <div className="admin-sidebar-brand">
          <button
            type="button"
            onClick={() => navigate(getPortalHomePath(user || readAdminUser()))}
            className={`admin-sidebar-brand__inner ${sidebarOpen ? '' : 'admin-sidebar-brand__inner--collapsed'}`}
            title={brandName}
          >
            <div className="admin-sidebar-brand__logo">
              {logoSrc ? (
                <img src={logoSrc} alt={brandName} />
              ) : (
                <span className="admin-sidebar-brand__fallback">
                  <Target className="h-5 w-5" />
                </span>
              )}
            </div>
            {sidebarOpen ? (
              <div className="min-w-0 flex-1 text-start">
                <p className="admin-sidebar-brand__name">{brandName}</p>
                <p className="admin-sidebar-brand__tagline">{t('layout.adminPanel')}</p>
              </div>
            ) : null}
          </button>
          {!isMobile ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="admin-sidebar-icon-btn"
              title={sidebarOpen ? t('layout.collapseSidebar') : t('layout.expandSidebar')}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                setSidebarOpen(false)
              }}
              className="admin-sidebar-icon-btn"
              aria-label={t('layout.closeMenu')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <AdminSidebarNav
          sections={navSections}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
          onNavigate={closeMobileNav}
        />

        {user ? (
          <div className="admin-sidebar-footer">
            <div className={`flex items-center gap-2 ${sidebarOpen ? '' : 'justify-center'}`}>
              <Avatar src={userAvatarSrc || undefined} name={user.name} size={40} />
              {sidebarOpen ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="admin-sidebar-footer__role">{t('layout.admin')}</p>
                </div>
              ) : null}
            </div>
            {sidebarOpen ? (
              <button type="button" onClick={handleLogout} className="admin-sidebar-logout-btn">
                <LogOut className="h-4 w-4" />
                {t('layout.logout')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="admin-sidebar-logout-btn mt-2 !w-auto !justify-center !p-2"
                title={t('layout.logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="admin-topbar sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 lg:px-6"
          style={{ boxShadow: 'var(--elevation-card)' }}
        >
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center border border-[var(--admin-border)] bg-[var(--admin-surface)] lg:hidden"
            style={{ borderRadius: 'var(--admin-radius-control)' }}
            onClick={() => {
              setMobileMenuOpen(true)
              setSidebarOpen(true)
            }}
            aria-label={t('layout.openMenu')}
          >
            <Menu className="h-5 w-5 text-[var(--admin-text)]" />
          </button>

          <div className="ms-auto flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <ThemeToggle />
            <div className="hidden sm:block">
              <Notifications />
            </div>
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1.5"
                  style={{ borderRadius: 'var(--admin-radius-control)' }}
                >
                  <Avatar src={userAvatarSrc || undefined} name={user.name} size={36} />
                  <ChevronDown className={`hidden h-4 w-4 text-[var(--admin-text-muted)] transition sm:block ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {userDropdownOpen ? (
                  <div
                    className="absolute end-0 mt-2 w-60 border border-[var(--admin-border)] bg-[var(--admin-surface)] py-2"
                    style={{ borderRadius: 'var(--admin-radius-modal)', boxShadow: 'var(--elevation-modal)' }}
                  >
                    <div className="border-b border-[var(--admin-border)] px-4 py-2">
                      <p className="text-sm font-semibold text-[var(--admin-text)]">{user.name}</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">{user.email || user.phone}</p>
                    </div>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--admin-text)] hover:bg-[var(--admin-bg)]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t('layout.changeAvatar')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('layout.logout')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {showPageHeader && title ? (
            <div className="admin-page-header-bar w-full shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4 lg:px-8">
              <PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} action={action} />
            </div>
          ) : null}
          <main
            className="admin-page-main flex w-full min-w-0 flex-1 flex-col overflow-y-auto"
            style={{ backgroundColor: 'var(--admin-bg)' }}
          >
            <div className={`admin-page admin-page-body w-full max-w-none min-w-0 flex-1 px-4 py-6 lg:px-8 ${className}`}>
              {pageLoading ? (
                <div className="mb-6 grid gap-4 md:grid-cols-2" aria-busy="true">
                  <LoadingSkeleton variant="card" />
                  <LoadingSkeleton variant="card" />
                </div>
              ) : null}
              <div className={pageLoading ? 'pointer-events-none opacity-0 h-0 overflow-hidden' : undefined}>
                {children}
              </div>
              <PoweredByFooter compact platformName={brandName} className="mt-8 pb-2" />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
