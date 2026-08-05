import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Eye, EyeOff, Shield, Loader2, Sparkles, ArrowRight, Phone } from 'lucide-react'
import ThemeToggle from '../../components/ui/ThemeToggle'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import { PoweredByFooter } from '../../components/ui/PoweredByFooter'
import { formatImageSrc } from '../../utils/imageUtils'
import { API_URL, getPortalHomePath, toPortalPath } from '../utils/adminSession'
import { resetAdminSessionBootstrap } from '../components/AdminRoute'

function extractErrorMessage(err, fallback) {
  const data = err.response?.data
  if (!data) return fallback
  if (typeof data.error === 'string') return data.error
  if (typeof data.message === 'string') return data.message
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((e) => e.message || e.msg || String(e)).join(' · ')
  }
  if (data.error && typeof data.error === 'object') {
    return data.error.message || JSON.stringify(data.error)
  }
  return fallback
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const isVendorPortal = location.pathname.startsWith('/provider')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [brand, setBrand] = useState({
    logo: null,
    appName: '',
    appNameAr: '',
  })

  useEffect(() => {
    document.body.classList.add('admin-dashboard', 'admin-login-page')
    document.documentElement.style.height = '100%'
    document.body.style.height = '100%'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    const root = document.getElementById('root')
    if (root) {
      root.style.cssText =
        'display:block!important;height:100vh!important;width:100%!important;margin:0!important;padding:0!important;'
    }
    return () => {
      document.body.classList.remove('admin-login-page')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadBrand = async () => {
      setLogoLoading(true)
      try {
        const { data } = await axios.get(`${API_URL}/settings`, { timeout: 8000 })
        const s = data?.settings || {}
        if (!cancelled) {
          setBrand({
            logo: s.dashboardLogo || s.appLogo || null,
            appName: s.appName || '',
            appNameAr: s.appNameAr || '',
          })
        }
      } catch (err) {
        console.warn('Could not load login branding:', err)
      } finally {
        if (!cancelled) setLogoLoading(false)
      }
    }
    loadBrand()
    return () => {
      cancelled = true
    }
  }, [])

  const brandTitle =
    (rtl ? brand.appNameAr || brand.appName : brand.appName || brand.appNameAr) ||
    t('adminLogin.title')
  const logoSrc = brand.logo ? formatImageSrc(brand.logo) : null

  const finishLogin = (merged, authToken) => {
    resetAdminSessionBootstrap()
    localStorage.setItem('admin_token', authToken)
    localStorage.setItem('admin_user', JSON.stringify(merged))

    const fromPath = location.state?.from?.pathname
    const destination =
      fromPath && (fromPath.startsWith('/admin') || fromPath.startsWith('/provider'))
        ? toPortalPath(fromPath, merged)
        : getPortalHomePath(merged)
    navigate(destination, { replace: true })
  }

  const handleVendorLogin = async () => {
    const response = await axios.post(`${API_URL}/mobile/vendor/auth/login`, {
      phone: phone.trim(),
      password: password.trim(),
    })

    const vendor = response.data.vendor
    const authToken = response.data.token

    if (!response.data.success || !vendor || !authToken) {
      throw new Error(response.data.error || t('adminLogin.loginFailed'))
    }

    const merged = {
      id: vendor.id,
      name: vendor.name || vendor.businessName,
      phone: vendor.phone,
      email: vendor.email || null,
      role: 'PROVIDER',
      vendorType: vendor.vendorType ?? response.data.vendorType ?? null,
      vendorStatus: vendor.status ?? response.data.status ?? null,
      businessName: vendor.businessName,
      avatar: vendor.avatar ?? null,
      permissions: response.data.permissions ?? null,
      isFullAdmin: false,
      authSource: 'vendor',
    }

    finishLogin(merged, authToken)
  }

  const handleAdminLogin = async () => {
    const response = await axios.post(`${API_URL}/auth/admin/login`, {
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    const userData = response.data.user
    const authToken = response.data.token

    if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'PROVIDER')) {
      setError(t('adminLogin.noAccess'))
      return
    }

    const merged = {
      ...userData,
      vendorType: response.data.vendorType ?? userData.vendorType ?? null,
      vendorStatus: response.data.vendorStatus ?? userData.vendorStatus ?? null,
      permissions: response.data.permissions ?? userData.permissions ?? null,
      isFullAdmin: response.data.isFullAdmin === true || userData.role === 'ADMIN',
      authSource: 'admin',
    }

    finishLogin(merged, authToken)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isVendorPortal) {
        await handleVendorLogin()
      } else {
        await handleAdminLogin()
      }
    } catch (err) {
      const isNetworkError = err.code === 'ERR_NETWORK' || err.message === 'Network Error'
      setError(
        isNetworkError
          ? t('adminLogin.networkError')
          : extractErrorMessage(err, err.message || t('adminLogin.loginFailed')),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-dashboard-scope admin-login-v2" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="admin-login-v2__mesh" aria-hidden />
      <div className="admin-login-v2__grid" aria-hidden />

      <header className="admin-login-v2__toolbar">
        <LanguageSwitcher />
        <ThemeToggle />
      </header>

      <main className="admin-login-v2__main">
        <section className="admin-login-v2__card">
          <div className="admin-login-v2__hero">
            <div className="admin-login-v2__logo-ring">
              {logoLoading ? (
                <div className="admin-login-v2__logo-skeleton" aria-hidden />
              ) : logoSrc ? (
                <img
                  src={logoSrc}
                  alt={brandTitle}
                  className="admin-login-v2__logo-img"
                  onError={() => setBrand((b) => ({ ...b, logo: null }))}
                />
              ) : (
                <span className="admin-login-v2__logo-fallback" aria-hidden>
                  {brandTitle.charAt(0) || 'F'}
                </span>
              )}
            </div>
            <div className="admin-login-v2__hero-text">
              <span className="admin-login-v2__badge">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                {isVendorPortal
                  ? (rtl ? 'دخول آمن لمزود الخدمة' : 'Secure vendor login')
                  : t('adminLogin.secured')}
              </span>
              <h1>{brandTitle}</h1>
              <p>
                {isVendorPortal
                  ? (rtl ? 'سجّل الدخول لإدارة حسابك كمزود خدمة' : 'Sign in to manage your vendor account')
                  : t('adminLogin.subtitle')}
              </p>
            </div>
          </div>

          <form className="admin-login-v2__form" onSubmit={handleSubmit} noValidate>
            <div className="admin-login-v2__form-head">
              <h2>{isVendorPortal ? (rtl ? 'لوحة مزود الخدمة' : 'Vendor panel') : t('adminLogin.title')}</h2>
              <p>
                {isVendorPortal
                  ? (rtl ? 'استخدم رقم الهاتف وكلمة المرور' : 'Use your phone number and password')
                  : t('adminLogin.formHint')}
              </p>
            </div>

            {error ? (
              <div className="admin-login-v2__error" role="alert">
                {error}
              </div>
            ) : null}

            {isVendorPortal ? (
              <div className="admin-login-v2__field">
                <label htmlFor="vendor-login-phone">{rtl ? 'رقم الهاتف' : 'Phone'}</label>
                <div className="admin-login-v2__input-group" dir="ltr">
                  <span className="admin-login-v2__input-addon" aria-hidden>
                    <Phone className="h-[18px] w-[18px]" />
                  </span>
                  <input
                    id="vendor-login-phone"
                    className="admin-login-v2__input-field"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0501634567"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="admin-login-v2__field">
                <label htmlFor="admin-login-email">{t('adminLogin.email')}</label>
                <div className="admin-login-v2__input-group" dir="ltr">
                  <span className="admin-login-v2__input-addon" aria-hidden>
                    <Mail className="h-[18px] w-[18px]" />
                  </span>
                  <input
                    id="admin-login-email"
                    className="admin-login-v2__input-field"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('adminLogin.emailPlaceholder')}
                    required
                  />
                </div>
              </div>
            )}

            <div className="admin-login-v2__field">
              <label htmlFor="admin-login-password">{t('adminLogin.password')}</label>
              <div className="admin-login-v2__input-group" dir="ltr">
                <span className="admin-login-v2__input-addon" aria-hidden>
                  <Lock className="h-[18px] w-[18px]" />
                </span>
                <input
                  id="admin-login-password"
                  className="admin-login-v2__input-field"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('adminLogin.passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  className="admin-login-v2__input-action"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="admin-login-v2__submit">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  {t('adminLogin.submitting')}
                </>
              ) : (
                <>
                  {t('adminLogin.submit')}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </>
              )}
            </button>
          </form>

          <ul className="admin-login-v2__features" aria-label={t('adminLogin.featuresLabel')}>
            <li>
              <Sparkles className="h-4 w-4" aria-hidden />
              {t('adminLogin.feature1')}
            </li>
            <li>
              <Shield className="h-4 w-4" aria-hidden />
              {t('adminLogin.feature2')}
            </li>
          </ul>

          <PoweredByFooter compact platformName={brandTitle} className="admin-login-v2__footer" />
        </section>
      </main>
    </div>
  )
}
