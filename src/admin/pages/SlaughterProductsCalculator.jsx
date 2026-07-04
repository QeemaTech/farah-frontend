import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, Coins, HelpCircle, Sparkles, Users } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import AdminPage from '../components/AdminPage'
import { getSlaughterApiMode, apiOrigin } from '../utils/adminSession'

const token = () => localStorage.getItem('admin_token')
const headers = () => ({ Authorization: `Bearer ${token()}` })

const normalizeArabicDigits = (value) => {
  if (!value) return ''
  const map = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' }
  return value
    .replace(/[٠-٩]/g, (d) => map[d] || d)
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '')
}

const fmt = (n, locale) => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(Number(n || 0))
const fmtVat = (n, locale) => fmt(n, locale)

function VatBreakdown({ item, locale, cur, compact = false }) {
  if (!item?.subtotalExVat && item?.subtotalExVat !== 0) return null
  const cls = compact ? 'text-xs' : 'text-sm'
  return (
    <div className={`${cls} space-y-1 text-[var(--admin-text-muted)]`}>
      <p>
        {locale === 'ar' ? 'السعر (بدون ضريبة)' : 'Subtotal (ex VAT)'}:{' '}
        <span className="font-semibold text-[var(--admin-text)]">{fmtVat(item.subtotalExVat, locale)} {cur}</span>
      </p>
      <p>
        {locale === 'ar' ? `ضريبة (${item.vatRate}%)` : `VAT (${item.vatRate}%)`}:{' '}
        <span className="font-semibold text-[var(--admin-text)]">{fmtVat(item.vatAmount, locale)} {cur}</span>
      </p>
      <p>
        {locale === 'ar' ? 'الإجمالي شامل الضريبة' : 'Total incl. VAT'}:{' '}
        <span className="font-semibold text-[var(--admin-success)]">{fmtVat(item.totalInclVat, locale)} {cur}</span>
      </p>
    </div>
  )
}
const fmtKg = (n, locale) =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { maximumFractionDigits: 2 }).format(Number(n || 0))

export default function SlaughterProductsCalculator() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const cur = t('slaughter.currencyShort')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    guestCount: '',
    categoryId: '',
    productId: '',
    budget: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const { categoriesUrl, productsUrl, headers: hdr, useVendorProductApi } = getSlaughterApiMode()
        const [resCat, resProd] = await Promise.all([
          hdr.Authorization
            ? axios.get(categoriesUrl, { headers: hdr })
            : axios.get(categoriesUrl),
          axios.get(productsUrl, {
            headers: hdr,
            params: useVendorProductApi
              ? { limit: 500, offset: 0 }
              : { limit: 500, offset: 0, isApproved: true, isActive: true },
          }),
        ])
        setCategories(resCat.data.categories || [])
        setProducts(resProd.data.products || [])
      } catch {
        toast.error(t('slaughter.loadFailed'))
      }
    }
    load()
  }, [t])

  const filteredProducts = useMemo(
    () => products.filter((p) => p.categoryId === form.categoryId),
    [products, form.categoryId],
  )

  const recommendation = useMemo(() => {
    if (!result) return null
    if (Array.isArray(result.withinBudget) && result.withinBudget.length) return result.withinBudget[0]
    return result.bestValue || result.suggestions?.[0] || null
  }, [result])

  const topSuggestions = useMemo(() => (result?.suggestions || []).slice(0, 3), [result])

  const getSuggestionWeightKg = (s) => Number(s?.variant?.weightKg || s?.product?.weightKg || 0)
  const getTotalKgForSuggestion = (s) => getSuggestionWeightKg(s) * Number(s?.quantity || 0)
  const getPerPersonKg = (s) => {
    const guests = Number(result?.guestCount || 0)
    if (!guests) return 0
    return getTotalKgForSuggestion(s) / guests
  }
  const totalSuggestedCost = useMemo(
    () => topSuggestions.reduce((sum, s) => sum + Number(s?.totalPrice || 0), 0),
    [topSuggestions],
  )

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === form.productId) || recommendation?.product || null,
    [products, form.productId, recommendation],
  )

  const submit = async (e) => {
    e.preventDefault()
    const guestCount = Number(normalizeArabicDigits(form.guestCount))
    const budgetRaw = normalizeArabicDigits(form.budget)
    const budgetNumber = budgetRaw ? Number(budgetRaw) : undefined

    if (!guestCount || guestCount < 1) {
      toast.error(t('slaughter.calcGuests'))
      return
    }
    if (budgetRaw && Number.isNaN(budgetNumber)) {
      toast.error(t('slaughter.calcBudgetInvalid'))
      return
    }

    try {
      setLoading(true)
      const { calculateUrl, calculateAuth } = getSlaughterApiMode()
      const { data } = await axios.post(
        calculateUrl,
        {
          guestCount,
          categoryId: form.categoryId || undefined,
          productId: form.productId || undefined,
          budget: budgetNumber,
        },
        calculateAuth,
      )
      setResult(data || null)
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || t('slaughter.calcFailed')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPage
      title={t('slaughter.calcPageTitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughter.productsTitle'), path: '/admin/slaughter/products' },
        { label: t('slaughter.calcPageTitle') },
      ]}
    >
      <div className="w-full space-y-6" dir={rtl ? 'rtl' : 'ltr'}>
        <section className="relative overflow-hidden rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)]">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ background: 'color-mix(in srgb, var(--admin-accent) 35%, transparent)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full opacity-30 blur-3xl"
            style={{ background: 'color-mix(in srgb, var(--admin-success) 40%, transparent)' }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-1 text-xs font-semibold text-[var(--admin-accent)]">
                <Sparkles className="h-3.5 w-3.5" />
                {t('slaughter.calcPageBadge')}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--admin-text)] md:text-3xl">{t('slaughter.calcPageTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--admin-text-muted)]">{t('slaughter.calcPageSubtitle')}</p>
            </div>
            <Link
              to="/admin/slaughter/products"
              className="ads-btn ads-btn-subtle shrink-0 gap-2"
            >
              <ArrowRight className={`h-4 w-4 ${rtl ? '' : 'rotate-180'}`} />
              {t('slaughter.calcBackProducts')}
            </Link>
          </div>
        </section>

        <details className="group rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-card)]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-[var(--admin-text)] marker:content-none [&::-webkit-details-marker]:hidden">
            <HelpCircle className="h-4 w-4 shrink-0 text-[var(--admin-accent)]" />
            {t('slaughter.calcHowTitle')}
            <span className="ms-auto text-xs font-normal text-[var(--admin-text-muted)] group-open:hidden">…</span>
          </summary>
          <div className="space-y-4 border-t border-[var(--admin-border)] px-5 pb-5 pt-4 text-sm leading-relaxed text-[var(--admin-text-muted)]">
            <p className="text-[var(--admin-text)]">{t('slaughter.calcHowIntro')}</p>
            <div>
              <p className="mb-2 font-semibold text-[var(--admin-text)]">{t('slaughter.calcHowInputsTitle')}</p>
              <ul className="list-disc space-y-1 ps-5">
                <li>{t('slaughter.calcHowInputGuests')}</li>
                <li>{t('slaughter.calcHowInputCategory')}</li>
                <li>{t('slaughter.calcHowInputProduct')}</li>
                <li>{t('slaughter.calcHowInputBudget')}</li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold text-[var(--admin-text)]">{t('slaughter.calcHowOutputsTitle')}</p>
              <ul className="list-disc space-y-1 ps-5">
                <li>{t('slaughter.calcHowOutputSuggestions')}</li>
                <li>{t('slaughter.calcHowOutputBest')}</li>
              </ul>
            </div>
          </div>
        </details>

        <section className="grid gap-6 lg:grid-cols-2">
          <aside>
            <form
              onSubmit={submit}
              className="space-y-4 rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)] lg:min-h-[620px]"
            >
              <div className="flex items-center gap-2 border-b border-[var(--admin-border)] pb-4">
                <Calculator className="h-5 w-5 text-[var(--admin-accent)]" />
                <h3 className="text-base font-semibold text-[var(--admin-text)]">{t('slaughter.calcFormSettingsTitle')}</h3>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text)]">{t('slaughter.calcGuestField')}</label>
                <input
                  className="admin-input"
                  inputMode="numeric"
                  required
                  value={form.guestCount}
                  onChange={(e) => setForm({ ...form, guestCount: normalizeArabicDigits(e.target.value) })}
                  placeholder={t('slaughter.calcGuestsPh')}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text)]">{t('slaughter.calcCategoryField')}</label>
                <select
                  className="admin-input"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value, productId: '' })}
                >
                  <option value="">{t('slaughter.calcPickCategory')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text)]">{t('slaughter.calcProductField')}</label>
                <select
                  className="admin-input disabled:opacity-50"
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  disabled={!form.categoryId}
                >
                  <option value="">{t('slaughter.calcPickProduct')}</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text)]">{t('slaughter.calcBudgetPh')}</label>
                <input
                  className="admin-input"
                  inputMode="decimal"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: normalizeArabicDigits(e.target.value) })}
                  placeholder={t('slaughter.calcBudgetPh')}
                />
              </div>

              <button type="submit" disabled={loading} className="ads-btn ads-btn-primary h-12 w-full justify-center text-base font-semibold disabled:opacity-60">
                {loading ? t('layout.loading') : t('slaughter.calcSubmit')}
              </button>
            </form>
          </aside>

          <div className="space-y-4">
            {!result ? (
              <div className="flex min-h-[620px] flex-col items-center justify-center gap-3 rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] border-dashed bg-[var(--admin-bg)]/40 p-8 text-center shadow-[var(--admin-shadow-card)]">
                <Calculator className="h-10 w-10 text-[var(--admin-text-muted)]" />
                <p className="max-w-sm text-sm text-[var(--admin-text-muted)]">{t('slaughter.calcResultsEmpty')}</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-shadow-card)]">
                    <p className="text-xs text-[var(--admin-text-muted)]">{t('slaughter.calcSummaryGuests')}</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[var(--admin-text)]">
                      <Users className="h-5 w-5 text-[var(--admin-accent)]" />
                      {fmt(result.guestCount, i18n.language)}
                    </p>
                  </div>
                  <div className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-shadow-card)]">
                    <p className="text-xs text-[var(--admin-text-muted)]">{t('slaughter.calcSummarySuggestions')}</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--admin-text)]">{fmt(result.suggestions?.length || 0, i18n.language)}</p>
                  </div>
                  <div className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-shadow-card)]">
                    <p className="text-xs text-[var(--admin-text-muted)]">{t('slaughter.calcBudgetLbl')}</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[var(--admin-text)]">
                      <Coins className="h-5 w-5 text-[var(--admin-success)]" />
                      {fmt(result.budget || 0, i18n.language)}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-[var(--admin-radius-card)] border p-5 shadow-[var(--admin-shadow-card)]"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--admin-success) 35%, var(--admin-border))',
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--admin-success) 12%, var(--admin-surface)), var(--admin-surface))',
                  }}
                >
                  <p className="mb-3 text-sm font-semibold text-[var(--admin-success)]">{t('slaughter.calcBestPickTitle')}</p>
                  <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                    <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
                      {selectedProduct?.image ? (
                        <img
                          src={`${apiOrigin()}${selectedProduct.image}`}
                          alt={selectedProduct.nameAr || selectedProduct.name}
                          className="h-28 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-28 items-center justify-center px-2 text-center text-xs text-[var(--admin-text-muted)]">
                          {t('slaughter.calcNoProductImage')}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-[var(--admin-text)]">
                      <p className="text-lg font-bold">{recommendation?.displayName || recommendation?.product?.nameAr || '-'}</p>
                      <p>
                        {t('slaughter.calcLabelQuantity')}: <span className="font-semibold">{fmt(recommendation?.quantity || 0, i18n.language)}</span>
                      </p>
                      <p>
                        {t('slaughter.calcLabelWeight')}:{' '}
                        <span className="font-semibold">
                          {fmtKg(getSuggestionWeightKg(recommendation), i18n.language)} {t('slaughter.unitKg')}
                        </span>
                      </p>
                      <p>
                        {t('slaughter.calcLabelTotalMeat')}:{' '}
                        <span className="font-semibold">
                          {fmtKg(getTotalKgForSuggestion(recommendation), i18n.language)} {t('slaughter.unitKg')}
                        </span>
                      </p>
                      <p>
                        {t('slaughter.calcLabelUnitPrice')}:{' '}
                        <span className="font-semibold">
                          {fmt(recommendation?.unitPrice || 0, i18n.language)} {cur}
                        </span>
                      </p>
                      <p>
                        {t('slaughter.calcLabelTotal')}:{' '}
                        <span className="font-semibold text-[var(--admin-success)]">
                          {fmt(recommendation?.totalPrice || 0, i18n.language)} {cur}
                        </span>
                      </p>
                      <VatBreakdown item={recommendation} locale={i18n.language} cur={cur} />
                      <p>
                        {t('slaughter.calcLabelPerPerson')}:{' '}
                        <span className="font-semibold">
                          {fmtKg(getPerPersonKg(recommendation), i18n.language)} {t('slaughter.unitKg')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {topSuggestions.map((s, idx) => (
                    <div
                      key={`${s.product?.id || 'x'}-${idx}`}
                      className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-shadow-card)]"
                    >
                      <p className="mb-2 text-xs font-semibold text-[var(--admin-text-muted)]">
                        {t('slaughter.calcSuggestionTitle')} #{idx + 1}
                      </p>
                      <p className="line-clamp-2 text-sm font-bold text-[var(--admin-text)]">{s.displayName || s.product?.nameAr}</p>
                      <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
                        {t('slaughter.calcLabelQuantity')}: {fmt(s.quantity, i18n.language)}
                      </p>
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        {t('slaughter.calcLabelTotalMeat')}: {fmtKg(getTotalKgForSuggestion(s), i18n.language)} {t('slaughter.unitKg')}
                      </p>
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        {t('slaughter.calcLabelTotal')}: {fmt(s.totalPrice, i18n.language)} {cur}
                      </p>
                      <VatBreakdown item={s} locale={i18n.language} cur={cur} compact />
                      <p className="text-xs font-medium text-[var(--admin-success)]">
                        {t('slaughter.calcLabelPerPerson')}: {fmtKg(getPerPersonKg(s), i18n.language)} {t('slaughter.unitKg')}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-[var(--admin-radius-card)] border p-4 text-sm shadow-[var(--admin-shadow-card)]"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--admin-success) 40%, var(--admin-border))',
                    background: 'color-mix(in srgb, var(--admin-success) 10%, var(--admin-surface))',
                    color: 'var(--admin-text)',
                  }}
                >
                  <p className="font-semibold">{t('slaughter.calcTotalBannerTitle')}</p>
                  <p className="mt-1 text-xl font-bold text-[var(--admin-success)]">
                    {fmt(result.totalsSummary?.totalInclVat ?? totalSuggestedCost, i18n.language)} {cur}
                  </p>
                  {result.totalsSummary && (
                    <VatBreakdown item={result.totalsSummary} locale={i18n.language} cur={cur} compact />
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </AdminPage>
  )
}
