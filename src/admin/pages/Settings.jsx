import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { AdminContent, UiCard, UiTableSkeleton } from '../design-system'
import {
  Save,
  Palette,
  Mail,
  Share2,
  Coins,
  MessageCircle,
  ImageIcon,
  Upload,
  Globe,
  Percent,
  Smartphone,
} from 'lucide-react'
import { formatImageSrc } from '../../utils/imageUtils'
import { API_URL } from '../utils/adminSession'

const TABS = [
  { id: 'brand', icon: Palette, descAr: 'الاسم، الشعارات، والألوان', descEn: 'Names, logos, and colors' },
  { id: 'contact', icon: Mail, descAr: 'البريد والهاتف والعنوان', descEn: 'Email, phone, and address' },
  { id: 'social', icon: Share2, descAr: 'روابط التواصل والمتاجر', descEn: 'Social and app store links' },
  { id: 'currency', icon: Coins, descAr: 'العملة وعمولة المنصة', descEn: 'Currency and commission' },
  { id: 'share', icon: MessageCircle, descAr: 'رسالة المشاركة الافتراضية', descEn: 'Default share message' },
]

const SOCIAL_FIELDS = [
  { name: 'facebookUrl', label: 'Facebook' },
  { name: 'twitterUrl', label: 'Twitter / X' },
  { name: 'instagramUrl', label: 'Instagram' },
  { name: 'linkedinUrl', label: 'LinkedIn' },
  { name: 'playStoreUrl', label: 'Google Play', icon: Smartphone },
  { name: 'appStoreUrl', label: 'App Store', icon: Smartphone },
]

const INITIAL_FORM = {
  appName: '',
  appNameAr: '',
  appLogo: '',
  dashboardLogo: '',
  favicon: '',
  primaryColor: '#4f46e5',
  secondaryColor: '#312e81',
  email: '',
  phone: '',
  address: '',
  addressAr: '',
  facebookUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  playStoreUrl: '',
  appStoreUrl: '',
  shareMessage: '',
  shareMessageAr: '',
  currencyName: 'Saudi Riyal',
  currencySymbol: 'ر.س',
  currencyCode: 'SAR',
  currencyDecimals: 2,
  currencyPosition: 'AFTER',
  commissionType: 'PERCENTAGE',
  commissionValue: 10,
  vatRate: 14.5,
}

function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-[var(--admin-text-muted)]">{hint}</p> : null}
    </div>
  )
}

function ImageUpload({ label, hint, value, onFile, emptyLabel }) {
  const src = formatImageSrc(value)
  return (
    <Field label={label} hint={hint}>
      <div className="settings-upload">
        <div className="settings-upload__preview">
          {src ? (
            <img src={src} alt="" />
          ) : (
            <span className="settings-upload__empty">{emptyLabel}</span>
          )}
        </div>
        <label className="ads-btn ads-btn-subtle w-full cursor-pointer justify-center gap-2 text-sm">
          <Upload className="h-4 w-4" aria-hidden />
          <span>{emptyLabel}</span>
          <input
            type="file"
            accept="image/*"
            className="absolute h-0 w-0 overflow-hidden opacity-0"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onFile(f)
              e.target.value = ''
            }}
          />
        </label>
      </div>
    </Field>
  )
}

function Settings() {
  const { language, t } = useLanguage()
  const ar = language === 'ar'
  const [tab, setTab] = useState('brand')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const settingsFetchedRef = useRef(false)
  const fetchingRef = useRef(false)

  const L = (a, e) => (ar ? a : e)

  useEffect(() => {
    if (settingsFetchedRef.current || fetchingRef.current) {
      setLoading(false)
      return
    }
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const response = await axios.get(`${API_URL}/settings`, { timeout: 5000 })
      if (response.data.settings) {
        const s = response.data.settings
        setFormData({
          ...INITIAL_FORM,
          appName: s.appName || '',
          appNameAr: s.appNameAr || '',
          appLogo: s.appLogo || '',
          dashboardLogo: s.dashboardLogo || '',
          favicon: s.favicon || '',
          primaryColor: s.primaryColor || '#4f46e5',
          secondaryColor: s.secondaryColor || '#312e81',
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || '',
          addressAr: s.addressAr || '',
          facebookUrl: s.facebookUrl || '',
          twitterUrl: s.twitterUrl || '',
          instagramUrl: s.instagramUrl || '',
          linkedinUrl: s.linkedinUrl || '',
          playStoreUrl: s.playStoreUrl || '',
          appStoreUrl: s.appStoreUrl || '',
          shareMessage: s.shareMessage || '',
          shareMessageAr: s.shareMessageAr || '',
          currencyName: s.currencyName || 'Saudi Riyal',
          currencySymbol: s.currencySymbol || 'ر.س',
          currencyCode: s.currencyCode || 'SAR',
          currencyDecimals: s.currencyDecimals != null ? s.currencyDecimals : 2,
          currencyPosition: s.currencyPosition || 'AFTER',
          commissionType: s.commissionType || 'PERCENTAGE',
          commissionValue: s.commissionValue != null ? s.commissionValue : 10,
          vatRate: s.vatRate != null ? s.vatRate : 14.5,
        })
      }
      settingsFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching settings:', error)
      settingsFetchedRef.current = true
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (field, file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(L('الملف المحدد ليس صورة', 'Selected file is not an image'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(L('حجم الصورة كبير (الحد 5MB)', 'Image too large (max 5MB)'))
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (result && typeof result === 'string') {
        setFormData((prev) => ({ ...prev, [field]: result }))
        toast.success(L('تم رفع الصورة', 'Image uploaded'))
      } else {
        toast.error(L('فشل قراءة الصورة', 'Failed to read image'))
      }
    }
    reader.onerror = () => toast.error(L('فشل قراءة الصورة', 'Failed to read image'))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token')
      const response = await axios.patch(
        `${API_URL}/settings`,
        {
          ...formData,
          appLogo: formData.appLogo || null,
          dashboardLogo: formData.dashboardLogo || null,
          favicon: formData.favicon || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (response.data.success) {
        toast.success(L('تم حفظ الإعدادات', 'Settings saved'))
        settingsFetchedRef.current = false
        fetchingRef.current = false
        await fetchSettings()
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || L('فشل الحفظ', 'Save failed')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const tabLabel = (id) => {
    const m = {
      brand: L('الهوية', 'Brand'),
      contact: L('التواصل', 'Contact'),
      social: L('الروابط', 'Links'),
      currency: L('العملة', 'Currency'),
      share: L('المشاركة', 'Share'),
    }
    return m[id] || id
  }

  const activeTabMeta = TABS.find((x) => x.id === tab)
  const previewLogo = formatImageSrc(formData.dashboardLogo || formData.appLogo)
  const displayName = ar ? formData.appNameAr || formData.appName : formData.appName || formData.appNameAr

  const formatMoneyPreview = (amount = 199) => {
    const n = Number(amount).toFixed(formData.currencyDecimals)
    return formData.currencyPosition === 'BEFORE'
      ? `${formData.currencySymbol} ${n}`
      : `${n} ${formData.currencySymbol}`
  }

  if (loading) {
    return (
      <AdminPage title={L('الإعدادات', 'Settings')} subtitle={L('إعدادات المنصة', 'Platform settings')}>
        <AdminContent>
          <UiCard>
            <UiTableSkeleton rows={8} cols={2} />
          </UiCard>
        </AdminContent>
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={L('الإعدادات', 'Settings')}
      subtitle={L('تحكم بهوية التطبيق، التواصل، العملة، والعمولة من مكان واحد', 'Manage branding, contact, currency, and commission in one place')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: L('الإعدادات', 'Settings') },
      ]}
    >
      <AdminContent>
        <form onSubmit={handleSubmit} dir={ar ? 'rtl' : 'ltr'}>
          <div className={`settings-layout ${tab === 'brand' ? 'settings-layout--with-preview' : ''}`}>
            <UiCard ariaLabel={L('أقسام الإعدادات', 'Settings sections')}>
              <nav className="settings-nav" aria-label={L('أقسام الإعدادات', 'Settings sections')}>
                {TABS.map(({ id, icon: Icon, descAr, descEn }) => (
                  <button
                    key={id}
                    type="button"
                    className={`settings-nav__item ${tab === id ? 'settings-nav__item--active' : ''}`}
                    onClick={() => setTab(id)}
                  >
                    <Icon size={18} className="shrink-0 opacity-80" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate">{tabLabel(id)}</span>
                      <span className="block truncate text-[10px] font-normal opacity-70">
                        {ar ? descAr : descEn}
                      </span>
                    </span>
                  </button>
                ))}
              </nav>
            </UiCard>

            <div className="min-w-0 space-y-5">
              {activeTabMeta ? (
                <div>
                  <h2 className="settings-section-title">{tabLabel(tab)}</h2>
                  <p className="settings-section-desc">{ar ? activeTabMeta.descAr : activeTabMeta.descEn}</p>
                </div>
              ) : null}

              {tab === 'brand' && (
                <div className="space-y-5">
                  <UiCard ariaLabel={L('أسماء التطبيق', 'App names')}>
                    <div className="settings-field-grid settings-field-grid--2">
                      <Field label={L('الاسم (إنجليزي)', 'Name (English)')}>
                        <input type="text" name="appName" value={formData.appName} onChange={handleChange} className="admin-input" dir="ltr" />
                      </Field>
                      <Field label={L('الاسم (عربي)', 'Name (Arabic)')}>
                        <input type="text" name="appNameAr" value={formData.appNameAr} onChange={handleChange} className="admin-input" dir="rtl" />
                      </Field>
                    </div>
                  </UiCard>

                  <UiCard ariaLabel={L('الشعارات', 'Logos')}>
                    <div className="settings-field-grid settings-field-grid--3">
                      <ImageUpload
                        label={L('شعار التطبيق', 'App logo')}
                        hint={L('يظهر في التطبيق', 'Shown in the mobile app')}
                        value={formData.appLogo}
                        onFile={(f) => handleImageUpload('appLogo', f)}
                        emptyLabel={L('رفع شعار', 'Upload logo')}
                      />
                      <ImageUpload
                        label={L('شعار لوحة التحكم', 'Dashboard logo')}
                        hint={L('يظهر في السايدبار', 'Shown in sidebar')}
                        value={formData.dashboardLogo}
                        onFile={(f) => handleImageUpload('dashboardLogo', f)}
                        emptyLabel={L('رفع شعار', 'Upload logo')}
                      />
                      <ImageUpload
                        label={L('أيقونة المتصفح', 'Favicon')}
                        hint={L('تبويب المتصفح', 'Browser tab icon')}
                        value={formData.favicon}
                        onFile={(f) => handleImageUpload('favicon', f)}
                        emptyLabel={L('رفع أيقونة', 'Upload icon')}
                      />
                    </div>
                  </UiCard>

                  <UiCard ariaLabel={L('الألوان', 'Colors')}>
                    <div className="settings-field-grid settings-field-grid--2">
                      <Field label={L('اللون الأساسي', 'Primary color')}>
                        <div className="settings-color-row">
                          <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} />
                          <div className="settings-color-swatch" style={{ background: formData.primaryColor }} title={formData.primaryColor} />
                        </div>
                      </Field>
                      <Field label={L('اللون الثانوي', 'Secondary color')}>
                        <div className="settings-color-row">
                          <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} />
                          <div className="settings-color-swatch" style={{ background: formData.secondaryColor }} title={formData.secondaryColor} />
                        </div>
                      </Field>
                    </div>
                  </UiCard>
                </div>
              )}

              {tab === 'contact' && (
                <UiCard ariaLabel={L('التواصل', 'Contact')}>
                  <div className="settings-field-grid settings-field-grid--2">
                    <Field label={L('البريد الإلكتروني', 'Email')}>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="admin-input" dir="ltr" />
                    </Field>
                    <Field label={L('الهاتف', 'Phone')}>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="admin-input" dir="ltr" />
                    </Field>
                    <Field label={L('العنوان (إنجليزي)', 'Address (English)')} className="md:col-span-2">
                      <input type="text" name="address" value={formData.address} onChange={handleChange} className="admin-input" />
                    </Field>
                    <Field label={L('العنوان (عربي)', 'Address (Arabic)')} className="md:col-span-2">
                      <input type="text" name="addressAr" value={formData.addressAr} onChange={handleChange} className="admin-input" dir="rtl" />
                    </Field>
                  </div>
                </UiCard>
              )}

              {tab === 'social' && (
                <UiCard ariaLabel={L('الروابط', 'Links')}>
                  <div className="settings-field-grid settings-field-grid--2">
                    {SOCIAL_FIELDS.map(({ name, label, icon: Icon }) => (
                      <Field key={name} label={label}>
                        <div className="relative">
                          {Icon ? (
                            <Icon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)]" aria-hidden />
                          ) : (
                            <Globe className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)]" aria-hidden />
                          )}
                          <input
                            type="url"
                            name={name}
                            value={formData[name]}
                            onChange={handleChange}
                            className="admin-input ps-10"
                            dir="ltr"
                            placeholder="https://"
                          />
                        </div>
                      </Field>
                    ))}
                  </div>
                </UiCard>
              )}

              {tab === 'currency' && (
                <div className="space-y-5">
                  <UiCard ariaLabel={L('العملة', 'Currency')}>
                    <div className="settings-field-grid settings-field-grid--2">
                      <Field label={L('اسم العملة', 'Currency name')}>
                        <input type="text" name="currencyName" value={formData.currencyName} onChange={handleChange} className="admin-input" />
                      </Field>
                      <Field label={L('رمز العرض', 'Display symbol')}>
                        <input type="text" name="currencySymbol" value={formData.currencySymbol} onChange={handleChange} className="admin-input" />
                      </Field>
                      <Field label={L('رمز ISO', 'ISO code')}>
                        <input type="text" name="currencyCode" value={formData.currencyCode} onChange={handleChange} className="admin-input" dir="ltr" />
                      </Field>
                      <Field label={L('الخانات العشرية', 'Decimals')}>
                        <input type="number" name="currencyDecimals" min="0" max="6" value={formData.currencyDecimals} onChange={handleChange} className="admin-input" />
                      </Field>
                      <Field label={L('موضع الرمز', 'Symbol position')} className="md:col-span-2">
                        <select name="currencyPosition" value={formData.currencyPosition} onChange={handleChange} className="admin-input">
                          <option value="BEFORE">{L('قبل السعر', 'Before amount')}</option>
                          <option value="AFTER">{L('بعد السعر', 'After amount')}</option>
                        </select>
                      </Field>
                    </div>
                    <p className="mt-4 rounded-lg bg-[var(--admin-bg)] px-4 py-3 text-sm font-medium text-[var(--admin-text)]">
                      {L('معاينة:', 'Preview:')} {formatMoneyPreview(250)}
                    </p>
                  </UiCard>

                  <UiCard ariaLabel={L('الضريبة', 'VAT')}>
                    <div className="settings-field-grid settings-field-grid--2">
                      <Field
                        label={L('نسبة ضريبة القيمة المضافة (%)', 'VAT rate (%)')}
                        hint={L('تُطبَّق على الحجوزات والفواتير والطلبات', 'Applied to bookings, invoices, and orders')}
                      >
                        <input
                          type="number"
                          name="vatRate"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.vatRate}
                          onChange={handleChange}
                          className="admin-input"
                        />
                      </Field>
                    </div>
                    <p className="mt-4 rounded-lg bg-[var(--admin-bg)] px-4 py-3 text-sm text-[var(--admin-text-muted)]">
                      {L('معاينة على 100:', 'Preview on 100:')}{' '}
                      {formatMoneyPreview(100)} + {formData.vatRate}% ={' '}
                      {formatMoneyPreview(100 + (100 * Number(formData.vatRate || 0)) / 100)}
                    </p>
                  </UiCard>

                  <UiCard ariaLabel={L('العمولة', 'Commission')}>
                    <div className="settings-field-grid settings-field-grid--2">
                      <Field label={L('نوع العمولة', 'Commission type')}>
                        <select name="commissionType" value={formData.commissionType} onChange={handleChange} className="admin-input">
                          <option value="PERCENTAGE">{L('نسبة مئوية', 'Percentage')}</option>
                          <option value="FIXED">{L('مبلغ ثابت', 'Fixed amount')}</option>
                        </select>
                      </Field>
                      <Field
                        label={formData.commissionType === 'PERCENTAGE' ? L('النسبة (%)', 'Rate (%)') : L('المبلغ', 'Amount')}
                      >
                        <div className="relative">
                          <Percent className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)]" aria-hidden />
                          <input
                            type="number"
                            name="commissionValue"
                            min="0"
                            step={formData.commissionType === 'PERCENTAGE' ? 1 : 0.01}
                            value={formData.commissionValue}
                            onChange={handleChange}
                            className="admin-input ps-10"
                          />
                        </div>
                      </Field>
                    </div>
                  </UiCard>
                </div>
              )}

              {tab === 'share' && (
                <UiCard ariaLabel={L('المشاركة', 'Share')}>
                  <div className="settings-field-grid settings-field-grid--2">
                    <Field label={L('نص (إنجليزي)', 'Text (English)')}>
                      <textarea name="shareMessage" value={formData.shareMessage} onChange={handleChange} rows={5} className="admin-input min-h-[140px]" />
                    </Field>
                    <Field label={L('نص (عربي)', 'Text (Arabic)')}>
                      <textarea name="shareMessageAr" value={formData.shareMessageAr} onChange={handleChange} rows={5} className="admin-input min-h-[140px]" dir="rtl" />
                    </Field>
                  </div>
                </UiCard>
              )}

              <div className="settings-save-bar">
                <p className="text-sm text-[var(--admin-text-muted)]">
                  {L('التغييرات تُطبَّق على التطبيق ولوحة التحكم بعد الحفظ', 'Changes apply to the app and dashboard after saving')}
                </p>
                <button type="submit" disabled={saving} className="ads-btn ads-btn-primary min-w-[160px] gap-2">
                  <Save className="h-4 w-4" aria-hidden />
                  {saving ? L('جاري الحفظ…', 'Saving…') : L('حفظ الإعدادات', 'Save settings')}
                </button>
              </div>
            </div>

            {tab === 'brand' ? (
              <div className="settings-preview-card hidden lg:block">
                <UiCard ariaLabel={L('معاينة', 'Preview')}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
                    {L('معاينة مباشرة', 'Live preview')}
                  </p>
                  <div
                    className="settings-preview-brand"
                    style={{
                      '--preview-primary': formData.primaryColor,
                      '--preview-secondary': formData.secondaryColor,
                    }}
                  >
                    {previewLogo ? (
                      <img src={previewLogo} alt="" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                    )}
                    <p className="settings-preview-brand__name">{displayName || L('اسم التطبيق', 'App name')}</p>
                    <p className="text-xs opacity-80">{L('لوحة التحكم', 'Admin panel')}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-8 flex-1 rounded-md" style={{ background: formData.primaryColor }} title={formData.primaryColor} />
                    <div className="h-8 flex-1 rounded-md" style={{ background: formData.secondaryColor }} title={formData.secondaryColor} />
                  </div>
                </UiCard>
              </div>
            ) : null}
          </div>
        </form>
      </AdminContent>
    </AdminPage>
  )
}

export default Settings
