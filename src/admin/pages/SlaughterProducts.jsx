import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiOrigin, getSlaughterApiMode, isFullAdminUser, readAdminUser } from '../utils/adminSession'
import {
  Check,
  Pencil,
  Image as ImageIcon,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  X,
  Cpu,
  Calculator,
  Target,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import { AdminContent, Badge, SearchInput, UiCard, UiStats, UiStat, UiTable, UiTableSkeleton } from '../design-system'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
const token = () => localStorage.getItem('admin_token')
const headers = () => ({ Authorization: `Bearer ${token()}` })

export default function SlaughterProducts() {
  const { t, i18n } = useTranslation()
  const confirmDelete = useConfirmDelete()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const limit = 20

  const [filterCat, setFilterCat] = useState('')
  const [filterAppr, setFilterAppr] = useState('')
  const [search, setSearch] = useState('')

  const [showCalcModal, setShowCalcModal] = useState(false)
  const [calcLoading, setCalcLoading] = useState(false)
  const [calcResult, setCalcResult] = useState(null)
  const [calcForm, setCalcForm] = useState({
    guestCount: '',
    budget: '',
    region: '',
    categoryId: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { origin, headers: hdr, useVendorProductApi, usePublicCategoriesAndCalculate } = getSlaughterApiMode()
      if (useVendorProductApi) {
        const [resCat, resProd] = await Promise.all([
          axios.get(`${origin}/api/mobile/slaughter/categories`),
          axios.get(`${origin}/api/mobile/vendor/slaughter/products`, {
            headers: hdr,
            params: { limit: 500, offset: 0 },
          }),
        ])
        let prods = resProd.data.products || []
        if (filterCat) prods = prods.filter((p) => p.categoryId === filterCat)
        if (filterAppr !== '') prods = prods.filter((p) => String(!!p.isApproved) === filterAppr)
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          prods = prods.filter(
            (p) =>
              (p.nameAr || '').toLowerCase().includes(q) ||
              (p.name || '').toLowerCase().includes(q) ||
              (p.vendor?.name || '').toLowerCase().includes(q),
          )
        }
        const totalFiltered = prods.length
        const slice = prods.slice(page * limit, page * limit + limit)
        setCategories(resCat.data.categories || [])
        setProducts(slice)
        setTotal(totalFiltered)
      } else {
        const [resCat, resProd] = await Promise.all([
          axios.get(`${origin}/api/admin/slaughter/categories`, { headers: hdr }),
          axios.get(`${origin}/api/admin/slaughter/products`, {
            headers: hdr,
            params: {
              limit,
              offset: page * limit,
              categoryId: filterCat || undefined,
              isApproved: filterAppr === '' ? undefined : filterAppr,
            },
          }),
        ])

        setCategories(resCat.data.categories || [])
        setProducts(resProd.data.products || [])
        setTotal(resProd.data.total || 0)
      }
    } catch {
      toast.error(t('slaughter.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, filterCat, filterAppr, search, t])

  useEffect(() => {
    loadData()
  }, [loadData, refreshKey])

  const handleDelete = async (id) => {
    const r = await confirmDelete({ text: t('slaughter.confirmDelete') })
    if (!r.isConfirmed) return
    try {
      const { origin, headers: hdr, useVendorProductApi } = getSlaughterApiMode()
      const url = useVendorProductApi
        ? `${origin}/api/mobile/vendor/slaughter/products/${id}`
        : `${origin}/api/admin/slaughter/products/${id}`
      await axios.delete(url, { headers: hdr })
      toast.success(t('slaughter.deleted'))
      setRefreshKey((v) => v + 1)
    } catch {
      toast.error(t('slaughter.deleteFailed'))
    }
  }

  const handleApprove = async (id) => {
    if (!isFullAdminUser(readAdminUser())) return
    const r = await Swal.fire({
      title: t('slaughter.confirmApprove'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#64748B',
      confirmButtonText: t('common.save'),
      cancelButtonText: t('cancel'),
    })
    if (!r.isConfirmed) return
    try {
      await axios.patch(`${apiOrigin()}/api/admin/slaughter/products/${id}/approve`, {}, { headers: headers() })
      toast.success(t('slaughter.approved'))
      setRefreshKey((v) => v + 1)
    } catch {
      toast.error(t('slaughter.approveFailed'))
    }
  }

  const runCalculator = async (e) => {
    e.preventDefault()
    if (!calcForm.guestCount || Number(calcForm.guestCount) < 1) {
      toast.error(t('slaughter.calcGuests'))
      return
    }
    try {
      setCalcLoading(true)
      setCalcResult(null)
      const { calculateUrl, calculateAuth } = getSlaughterApiMode()
      const { data } = await axios.post(
        calculateUrl,
        {
          guestCount: Number(calcForm.guestCount),
          budget: calcForm.budget ? Number(calcForm.budget) : undefined,
          categoryId: calcForm.categoryId || undefined,
          region: calcForm.region || undefined,
        },
        calculateAuth,
      )
      setCalcResult(data || null)
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || t('slaughter.calcFailed')
      toast.error(msg)
    } finally {
      setCalcLoading(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (p.nameAr || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.category?.nameAr || '').toLowerCase().includes(q) ||
      (p.vendor?.name || '').toLowerCase().includes(q)
    )
  })

  const selectedCategoryName = calcForm.categoryId
    ? categories.find((c) => c.id === calcForm.categoryId)?.nameAr || t('slaughter.categoryUnset')
    : t('slaughter.allTypesOpt')

  const finalRecommendation = (() => {
    if (!calcResult) return null
    if (Array.isArray(calcResult.withinBudget) && calcResult.withinBudget.length > 0) {
      return calcResult.withinBudget[0]
    }
    return calcResult.bestValue || calcResult.suggestions?.[0] || null
  })()

  const approvedCount = products.filter((p) => p.isApproved).length
  const pendingCount = products.filter((p) => !p.isApproved).length
  const rtl = i18n.language === 'ar'
  const cur = t('slaughter.currencyShort')

  const headerActions = (
    <>
      <Link to="/admin/slaughter/products/calculator" className="ads-btn ads-btn-subtle gap-2">
        <Calculator className="h-4 w-4 shrink-0" aria-hidden />
        {t('slaughter.tryCalc')}
      </Link>
      <Link to="/admin/slaughter/products/add" className="ads-btn ads-btn-primary gap-2">
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        {t('slaughter.addProduct')}
      </Link>
    </>
  )

  const toolbar = (
    <>
      <div className="ui-search">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('slaughter.searchPh')}
        />
      </div>
      <select
        value={filterCat}
        onChange={(e) => {
          setFilterCat(e.target.value)
          setPage(0)
        }}
        className="admin-input h-11 min-w-[140px]"
      >
        <option value="">{t('slaughter.allCategories')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nameAr}
          </option>
        ))}
      </select>
      <select
        value={filterAppr}
        onChange={(e) => {
          setFilterAppr(e.target.value)
          setPage(0)
        }}
        className="admin-input h-11 min-w-[120px]"
      >
        <option value="">{t('slaughter.approvalAll')}</option>
        <option value="true">{t('slaughter.approved')}</option>
        <option value="false">{t('slaughter.pending')}</option>
      </select>
      <button
        type="button"
        onClick={() => {
          setFilterAppr('')
          setFilterCat('')
          setSearch('')
          setPage(0)
          setRefreshKey((v) => v + 1)
        }}
        className="ads-btn ads-btn-subtle gap-2"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        {t('slaughter.resetFilters')}
      </button>
      <button type="button" onClick={() => setShowCalcModal(true)} className="ads-btn ads-btn-subtle gap-2">
        <Cpu className="h-4 w-4 shrink-0" aria-hidden />
        {t('slaughter.calcModalTitle')}
      </button>
    </>
  )

  const productStatusBadge = (p) => {
    if (!p.isApproved) return <Badge variant="warning">{t('slaughter.statusPending')}</Badge>
    if (p.isActive) return <Badge variant="success">{t('slaughter.statusActive')}</Badge>
    return <Badge variant="danger">{t('slaughter.statusInactive')}</Badge>
  }

  return (
    <AdminPage
      title={t('slaughter.productsTitle')}
      subtitle={t('slaughter.productsSubtitle', { defaultValue: rtl ? 'إدارة منتجات الذبائح' : 'Manage slaughter products' })}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughter.productsTitle') },
      ]}
      action={headerActions}
    >
      <AdminContent>
        <UiStats>
          <UiStat icon={Target} iconTone="indigo" value={total} label={t('slaughter.totalProducts')} />
          <UiStat icon={Check} iconTone="emerald" value={approvedCount} label={t('slaughter.approvedCount')} />
          <UiStat icon={ImageIcon} iconTone="amber" value={pendingCount} label={t('slaughter.pendingCount')} />
        </UiStats>

        <UiCard toolbar={toolbar} ariaLabel={t('slaughter.filterTitle')}>
          {loading ? (
            <UiTableSkeleton rows={8} cols={8} />
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-[var(--admin-text-muted)]">{t('slaughter.noProducts')}</div>
          ) : (
            <>
              <UiTable minWidth={1100}>
                <thead>
                  <tr>
                    <th>{t('slaughter.tableImage')}</th>
                    <th>{t('slaughter.tableName')}</th>
                    <th>{t('slaughter.tableCatVendor')}</th>
                    <th>{t('slaughter.tablePriceWeight')}</th>
                    <th>{t('slaughter.tableAgeVariants')}</th>
                    <th>{t('slaughter.tableServes')}</th>
                    <th>{t('slaughter.tableStatus')}</th>
                    <th className="text-end">{t('slaughter.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-[var(--admin-bg)]/60">
                      <td>
                        {p.image ? (
                          <img
                            src={`${apiOrigin()}${p.image}`}
                            alt={p.nameAr}
                            className="h-12 w-12 rounded-xl border border-[var(--admin-border)] object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)]">
                            <ImageIcon className="h-5 w-5" aria-hidden />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--admin-text)]">{p.nameAr}</div>
                        <div className="text-xs text-[var(--admin-text-muted)]">{p.name}</div>
                      </td>
                      <td>
                        <div className="text-sm text-[var(--admin-text)]">{p.category?.nameAr || '—'}</div>
                        <div className="text-xs text-[var(--admin-accent)]">{p.vendor?.name || t('slaughter.unknownVendor')}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-[var(--admin-text)]">
                          {p.price} {cur}
                        </div>
                        <div className="text-xs text-[var(--admin-text-muted)]">{p.weightKg} kg</div>
                      </td>
                      <td>
                        <div className="text-sm text-[var(--admin-text)]">
                          {p.ageMonths ? `${p.ageMonths} ${t('slaughter.monthsShort')}` : '—'}
                        </div>
                        <div className="text-xs text-[var(--admin-text-muted)]">
                          {p.variants?.length || 0} {t('slaughter.variantsShort')}
                        </div>
                      </td>
                      <td>{p.servesMin} - {p.servesMax}</td>
                      <td>{productStatusBadge(p)}</td>
                      <td>
                        <div className="ui-actions">
                          {!p.isApproved && isFullAdminUser(readAdminUser()) && (
                            <button type="button" onClick={() => handleApprove(p.id)} className="ui-action-btn text-emerald-600" title={t('slaughter.approve')}>
                              <Check size={16} aria-hidden />
                            </button>
                          )}
                          <button type="button" onClick={() => navigate(`/admin/slaughter/products/${p.id}/edit`)} className="ui-action-btn" title={t('slaughter.edit')}>
                            <Pencil size={16} aria-hidden />
                          </button>
                          <Link to={`/admin/slaughter/products/${p.id}`} className="ui-action-btn" title={t('slaughter.open')}>
                            <ExternalLink size={16} aria-hidden />
                          </Link>
                          <button type="button" onClick={() => handleDelete(p.id)} className="ui-action-btn ui-action-btn--danger" title={t('slaughter.delete')}>
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </UiTable>
              <Pagination
                currentPage={page + 1}
                totalPages={Math.ceil(total / limit) || 1}
                onPageChange={(p) => setPage(p - 1)}
                total={total}
                limit={limit}
              />
            </>
          )}
        </UiCard>

        {showCalcModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="flex max-h-[min(90vh,calc(100vh-2rem))] w-full flex-col overflow-hidden rounded-[var(--admin-radius-card)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-dropdown)]">
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
                <h3 className="text-base font-bold text-[var(--admin-text)]">{t('slaughter.calcModalTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setShowCalcModal(false)}
                  className="admin-icon-btn border-0 shadow-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-2">
                <form onSubmit={runCalculator} className="space-y-3 rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] p-4">
                  <p className="text-sm font-semibold text-[var(--admin-text)]">{t('slaughter.calcFormTitle')}</p>
                  <input
                    type="number"
                    min="1"
                    required
                    value={calcForm.guestCount}
                    onChange={(e) => setCalcForm({ ...calcForm, guestCount: e.target.value })}
                    placeholder={t('slaughter.calcGuestsPh')}
                    className="admin-input"
                  />
                  <select
                    value={calcForm.categoryId}
                    onChange={(e) => setCalcForm({ ...calcForm, categoryId: e.target.value })}
                    className="admin-input"
                  >
                    <option value="">{t('slaughter.calcAllTypes')}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={calcForm.budget}
                    onChange={(e) => setCalcForm({ ...calcForm, budget: e.target.value })}
                    placeholder={t('slaughter.calcBudgetPh')}
                    className="admin-input"
                  />
                  <input
                    value={calcForm.region}
                    onChange={(e) => setCalcForm({ ...calcForm, region: e.target.value })}
                    placeholder={t('slaughter.calcRegionPh')}
                    className="admin-input"
                  />
                  <button
                    type="submit"
                    disabled={calcLoading}
                    className="ads-btn ads-btn-primary w-full justify-center disabled:opacity-60"
                  >
                    {calcLoading ? t('messages.loading') : t('slaughter.calcSubmit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalcForm({ guestCount: '', budget: '', region: '', categoryId: '' })
                      setCalcResult(null)
                    }}
                    className="ads-btn ads-btn-subtle w-full justify-center"
                  >
                    {t('slaughter.calcClear')}
                  </button>
                </form>

                <div className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] p-4">
                  {!calcResult ? (
                    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-[var(--admin-text-muted)]">
                      {t('slaughter.calcHint')}
                    </div>
                  ) : (
                    <div className="space-y-3 text-[var(--admin-text)]">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-center">
                          <p className="text-[11px] text-[var(--admin-text-muted)]">{t('slaughter.calcGuestCountLbl')}</p>
                          <p className="text-sm font-bold">{calcResult.guestCount}</p>
                        </div>
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-center">
                          <p className="text-[11px] text-[var(--admin-text-muted)]">{t('slaughter.calcTypeLbl')}</p>
                          <p className="text-sm font-bold">{selectedCategoryName}</p>
                        </div>
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-center">
                          <p className="text-[11px] text-[var(--admin-text-muted)]">{t('slaughter.calcQtyLbl')}</p>
                          <p className="text-sm font-bold">{finalRecommendation?.quantity ?? '?'}</p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-[var(--admin-bg)] p-3 text-sm">
                        <p>
                          {t('slaughter.calcSummaryGuests')}: <span className="font-semibold">{calcResult.guestCount}</span>
                        </p>
                        <p>
                          {t('slaughter.calcSummarySuggestions')}:{' '}
                          <span className="font-semibold">{calcResult.suggestions?.length || 0}</span>
                        </p>
                        {!!calcResult.budget && (
                          <p>
                            {t('slaughter.calcBudgetLbl')}:{' '}
                            <span className="font-semibold">
                              {calcResult.budget} {cur}
                            </span>
                          </p>
                        )}
                      </div>

                      {calcResult.bestValue && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-500/10 p-3 text-sm">
                          <p className="font-semibold text-emerald-800 dark:text-emerald-300">{t('slaughter.calcBestValue')}</p>
                          <p>
                            {calcResult.bestValue.displayName || calcResult.bestValue.product?.nameAr} ?{' '}
                            {calcResult.bestValue.quantity}
                          </p>
                          <p>
                            {t('slaughter.calcColTotal')}: {calcResult.bestValue.totalPrice} {cur}
                          </p>
                        </div>
                      )}

                      {calcResult.premium && (
                        <div className="rounded-lg border border-violet-200 bg-violet-500/10 p-3 text-sm">
                          <p className="font-semibold text-violet-800 dark:text-violet-300">{t('slaughter.calcPremium')}</p>
                          <p>
                            {calcResult.premium.displayName || calcResult.premium.product?.nameAr} ?{' '}
                            {calcResult.premium.quantity}
                          </p>
                          <p>
                            {t('slaughter.calcColTotal')}: {calcResult.premium.totalPrice} {cur}
                          </p>
                        </div>
                      )}

                      <div className="rounded-lg border border-[var(--admin-border)]">
                        <div className="border-b border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-xs font-semibold text-[var(--admin-text-muted)]">
                          {t('slaughter.calcFullResults')}
                        </div>
                        <div className="max-h-64 overflow-auto">
                          <table className="ui-table min-w-full text-xs">
                            <thead className="bg-[var(--admin-surface)] text-[var(--admin-text-muted)]">
                              <tr>
                                <th className="px-3 py-2">{t('slaughter.calcColType')}</th>
                                <th className="px-3 py-2">{t('slaughter.calcColServes')}</th>
                                <th className="px-3 py-2">{t('slaughter.calcColQty')}</th>
                                <th className="px-3 py-2">{t('slaughter.calcColUnit')}</th>
                                <th className="px-3 py-2">{t('slaughter.calcColTotal')}</th>
                                <th className="px-3 py-2">{t('slaughter.calcColState')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(calcResult.suggestions || []).map((s, idx) => (
                                <tr key={`${s.product.id}-${s.variant?.id ?? 'v0'}-${idx}`} className="border-t border-[var(--admin-border)]">
                                  <td className="px-3 py-2 font-medium">{s.displayName || s.product.nameAr}</td>
                                  <td className="px-3 py-2">
                                    {s.variant
                                      ? `${s.variant.servesMin} - ${s.variant.servesMax}`
                                      : `${s.product.servesMin} - ${s.product.servesMax}`}
                                  </td>
                                  <td className="px-3 py-2">{s.quantity}</td>
                                  <td className="px-3 py-2">
                                    {s.unitPrice} {cur}
                                  </td>
                                  <td className="px-3 py-2">
                                    {s.totalPrice} {cur}
                                  </td>
                                  <td className="px-3 py-2">
                                    {s.withinBudget === false ? (
                                      <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-700">{t('slaughter.calcOverBudget')}</span>
                                    ) : (
                                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-700">{t('slaughter.calcOk')}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {!!calcResult.combinations?.length && (
                        <div className="rounded-lg border border-indigo-200 bg-indigo-500/10 p-3 text-sm">
                          <p className="mb-2 font-semibold text-indigo-800 dark:text-indigo-300">{t('slaughter.calcComboTitle')}</p>
                          <div className="space-y-2">
                            {calcResult.combinations.slice(0, 2).map((combo, idx) => (
                              <div key={idx} className="rounded-lg border border-indigo-100 bg-[var(--admin-surface)] p-2">
                                <p className="text-xs text-[var(--admin-text-muted)]">
                                  {t('slaughter.calcComboCost')}: {combo.totalPrice} {cur} ? {t('slaughter.calcComboCover')}{' '}
                                  {combo.totalGuestsCovered} {t('slaughter.calcComboGuests')}
                                </p>
                                {combo.items.map((item) => (
                                  <p key={`${idx}-${item.product.id}`} className="text-xs">
                                    {item.displayName || item.product.nameAr} � {item.quantity}
                                  </p>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {finalRecommendation && (
                        <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-500/10 p-3 text-sm">
                          <p className="mb-1 font-semibold text-fuchsia-800 dark:text-fuchsia-300">{t('slaughter.calcFinalTitle')}</p>
                          <p>
                            {t('slaughter.calcFinalType')}:{' '}
                            <span className="font-semibold">
                              {finalRecommendation.displayName || finalRecommendation.product?.nameAr}
                            </span>
                          </p>
                          <p>
                            {t('slaughter.calcFinalGuests')}: <span className="font-semibold">{calcResult.guestCount}</span>
                          </p>
                          <p>
                            {t('slaughter.calcFinalQty')}: <span className="font-semibold">{finalRecommendation.quantity}</span>
                          </p>
                          <p>
                            {t('slaughter.calcFinalTotal')}: <span className="font-semibold">{finalRecommendation.totalPrice} {cur}</span>
                          </p>
                          <p>
                            {t('slaughter.calcFinalPerPerson')}:{' '}
                            <span className="font-semibold">{finalRecommendation.pricePerPerson} {cur}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminContent>
    </AdminPage>
  )
}
