import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import AdminDetailShell from '../components/AdminDetailShell'
import UiTabs from '../../components/ui/UiTabs'
import { AdminContent, Badge, UiCard, UiStat, UiStats, UiTable } from '../design-system'
import { API_URL, apiOrigin, getSlaughterApiMode } from '../utils/adminSession'
import { formatCurrency } from '../../utils/currency'
import {
  Eye,
  Layers,
  Package,
  ShoppingBag,
  Store,
  Target,
  TrendingUp,
} from 'lucide-react'

export default function SlaughterCategoryDetails() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const [category, setCategory] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [settings, setSettings] = useState(null)

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('slaughterCategoryDetail.tabOverview'), icon: Layers },
      { id: 'products', label: t('slaughterCategoryDetail.tabProducts'), icon: Package },
      { id: 'orders', label: t('slaughterCategoryDetail.tabOrders'), icon: ShoppingBag },
    ],
    [t],
  )

  useEffect(() => {
    axios
      .get(`${API_URL}/settings`, { timeout: 8000 })
      .then((r) => r.data?.settings && setSettings(r.data.settings))
      .catch(() => {})
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const { origin, headers, useVendorCategoryApi } = getSlaughterApiMode()
      const url = useVendorCategoryApi
        ? `${origin}/api/mobile/vendor/slaughter/categories/${id}`
        : `${origin}/api/admin/slaughter/categories/${id}`
      const { data } = await axios.get(url, { headers })
      setCategory(data.category)
      setStats(data.stats)
      setRecentOrders(data.recentOrders || [])
    } catch (e) {
      toast.error(e.response?.data?.error || t('slaughterCategoryDetail.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const displayName = category
    ? language === 'ar'
      ? category.nameAr || category.name
      : category.name || category.nameAr
    : ''

  const desc =
    language === 'ar'
      ? category?.descriptionAr || category?.description
      : category?.description || category?.descriptionAr

  const cur = {
    currencySymbol: settings?.currencySymbol || 'ر.س',
    currencyCode: settings?.currencyCode || 'SAR',
    currencyDecimals: settings?.currencyDecimals ?? 2,
    currencyPosition: settings?.currencyPosition || 'AFTER',
  }

  const imgSrc = (path) => (path ? `${apiOrigin()}${path}` : null)

  return (
    <AdminDetailShell
      title={displayName || t('slaughterCategoryDetail.title')}
      subtitle={t('slaughterCategoryDetail.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('slaughterCategories.title'), path: '/admin/slaughter/categories' },
        { label: displayName || t('slaughterCategoryDetail.title') },
      ]}
      backTo="/admin/slaughter/categories"
      backLabel={t('slaughterCategoryDetail.back')}
      loading={loading}
      empty={!loading && !category}
      emptyTitle={t('slaughterCategoryDetail.notFound')}
      noCard
    >
      {category ? (
        <AdminContent className="gap-6">
          <div className="admin-entity-hero">
            <div className="admin-entity-hero__visual">
              {category.image ? (
                <img src={imgSrc(category.image)} alt="" className="admin-entity-hero__img" />
              ) : category.icon ? (
                <img src={imgSrc(category.icon)} alt="" className="admin-entity-hero__img admin-entity-hero__img--icon" />
              ) : (
                <div className="admin-entity-hero__placeholder">
                  <Layers className="h-12 w-12" aria-hidden />
                </div>
              )}
            </div>
            <div className="admin-entity-hero__body">
              <div className="flex flex-wrap items-center gap-2">
                <h2>{displayName}</h2>
                <Badge variant={category.isActive ? 'success' : 'danger'}>
                  {category.isActive ? t('slaughterCategories.active') : t('slaughterCategories.inactive')}
                </Badge>
              </div>
              <p className="admin-entity-hero__muted">{desc || t('slaughterCategoryDetail.noDescription')}</p>
              <UiStats>
                <UiStat icon={Package} iconTone="indigo" value={stats?.productsTotal ?? 0} label={t('slaughterCategories.statProducts')} />
                <UiStat icon={Target} iconTone="emerald" value={stats?.productsActive ?? 0} label={t('active')} />
                <UiStat icon={Store} iconTone="amber" value={stats?.vendorsCount ?? 0} label={t('slaughterCategoryDetail.vendors')} />
                <UiStat icon={TrendingUp} iconTone="slate" value={stats?.orderItemsTotal ?? 0} label={t('slaughterCategoryDetail.orderLines')} />
              </UiStats>
            </div>
          </div>

          <UiTabs tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'overview' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <UiCard>
                <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('slaughterCategoryDetail.names')}</h3>
                <dl className="admin-detail-grid">
                  <div className="admin-detail-row">
                    <dt className="admin-detail-row__label">{t('name')} (EN)</dt>
                    <dd className="admin-detail-row__value" dir="ltr">
                      {category.name || '—'}
                    </dd>
                  </div>
                  <div className="admin-detail-row">
                    <dt className="admin-detail-row__label">{t('name')} (AR)</dt>
                    <dd className="admin-detail-row__value" dir="rtl">
                      {category.nameAr || '—'}
                    </dd>
                  </div>
                  <div className="admin-detail-row">
                    <dt className="admin-detail-row__label">{t('slaughterCategories.tableOrder')}</dt>
                    <dd className="admin-detail-row__value">{category.order}</dd>
                  </div>
                  <div className="admin-detail-row">
                    <dt className="admin-detail-row__label">{t('slaughterCategoryDetail.approvedProducts')}</dt>
                    <dd className="admin-detail-row__value">{stats?.productsApproved ?? 0}</dd>
                  </div>
                  <div className="admin-detail-row">
                    <dt className="admin-detail-row__label">{t('slaughterCategoryDetail.featuredProducts')}</dt>
                    <dd className="admin-detail-row__value">{stats?.productsFeatured ?? 0}</dd>
                  </div>
                </dl>
              </UiCard>
              <UiCard>
                <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('slaughterCategoryDetail.quickActions')}</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button type="button" className="text-[var(--admin-text-link)]" onClick={() => setTab('products')}>
                      {t('slaughterCategoryDetail.viewProducts')}
                    </button>
                  </li>
                  <li>
                    <Link to={`/admin/slaughter/products?category=${category.id}`} className="text-[var(--admin-text-link)]">
                      {t('slaughterCategoryDetail.browseProductsFilter')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/slaughter/orders" className="text-[var(--admin-text-link)]">
                      {t('nav.slaughterOrders')}
                    </Link>
                  </li>
                </ul>
              </UiCard>
            </div>
          )}

          {tab === 'products' && (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">
                {t('slaughterCategoryDetail.productsInCategory')} ({category.products?.length ?? 0})
              </h3>
              {!category.products?.length ? (
                <p className="py-12 text-center text-[var(--admin-text-muted)]">{t('slaughterCategoryDetail.noProducts')}</p>
              ) : (
                <UiTable minWidth={880}>
                  <thead>
                    <tr>
                      <th>{t('slaughterCategories.tableName')}</th>
                      <th>{t('slaughterDetail.vendor')}</th>
                      <th>{t('slaughterDetail.price')}</th>
                      <th>{t('slaughterDetail.weight')}</th>
                      <th>{t('status')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.products.map((p) => {
                      const pName = language === 'ar' ? p.nameAr || p.name : p.name || p.nameAr
                      const vendorName =
                        p.vendor?.vendorProfile?.businessName || p.vendor?.name || t('slaughterDetail.adminProduct')
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="font-semibold text-[var(--admin-text)]">{pName}</div>
                            <div className="text-xs text-[var(--admin-text-muted)]">
                              {p._count?.variants ?? 0} {t('slaughterCategoryDetail.variants')}
                            </div>
                          </td>
                          <td className="text-sm text-[var(--admin-text-muted)]">{vendorName}</td>
                          <td className="font-medium">{formatCurrency(p.price, cur)}</td>
                          <td>{p.weightKg} kg</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant={p.isActive ? 'success' : 'neutral'}>{p.isActive ? t('active') : t('inactive')}</Badge>
                              {p.isApproved ? <Badge variant="info">{t('slaughterCategoryDetail.approved')}</Badge> : null}
                              {p.isFeatured ? <Badge variant="warning">{t('slaughterDetail.featured')}</Badge> : null}
                            </div>
                          </td>
                          <td className="text-end">
                            <Link to={`/admin/slaughter/products/${p.id}`} className="ui-action-btn inline-flex">
                              <Eye size={16} aria-hidden />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </UiTable>
              )}
            </UiCard>
          )}

          {tab === 'orders' && (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('slaughterCategoryDetail.recentOrders')}</h3>
              {!recentOrders.length ? (
                <p className="py-12 text-center text-[var(--admin-text-muted)]">{t('slaughterCategoryDetail.noOrders')}</p>
              ) : (
                <UiTable minWidth={720}>
                  <thead>
                    <tr>
                      <th>{t('slaughterOrders.colOrder')}</th>
                      <th>{t('slaughterCategoryDetail.sampleProduct')}</th>
                      <th>{t('slaughterOrders.colStatus')}</th>
                      <th>{t('slaughterInvoices.colAmount')}</th>
                      <th>{t('date')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="font-mono text-xs font-semibold text-[var(--admin-accent)]">{o.orderNumber}</td>
                        <td className="text-sm">
                          {language === 'ar' ? o.sampleProduct?.nameAr : o.sampleProduct?.name}
                        </td>
                        <td>
                          <Badge variant="info">{o.status}</Badge>
                        </td>
                        <td className="font-semibold">{formatCurrency(o.totalAmount, cur)}</td>
                        <td className="text-sm text-[var(--admin-text-muted)]">
                          {new Date(o.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')}
                        </td>
                        <td className="text-end">
                          <Link to={`/admin/slaughter/orders/${o.id}`} className="ui-action-btn inline-flex">
                            <Eye size={16} aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </UiTable>
              )}
            </UiCard>
          )}
        </AdminContent>
      ) : null}
    </AdminDetailShell>
  )
}
