import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import AdminDetailShell from '../components/AdminDetailShell'
import UiTabs from '../../components/ui/UiTabs'
import { AdminContent, Badge, UiCard, UiStat, UiStats, UiTable } from '../design-system'
import { formatImageSrc } from '../../utils/imageUtils'
import { API_URL, parseAdminBoolean } from '../utils/adminSession'
import { Eye, Layers, Pencil, Target, TrendingUp } from 'lucide-react'

export default function CategoryDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('categoryDetail.tabOverview'), icon: Layers },
      { id: 'services', label: t('categoryDetail.tabServices'), icon: Target },
    ],
    [t, language],
  )

  useEffect(() => {
    fetchCategory()
  }, [id])

  const fetchCategory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const { data } = await axios.get(`${API_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCategory(data.category)
    } catch (err) {
      toast.error(err.response?.data?.error || t('categoryDetail.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const displayName = category
    ? language === 'ar'
      ? category.nameAr || category.name
      : category.name || category.nameAr
    : ''

  const activeServices = (category?.services || []).filter((s) => parseAdminBoolean(s.isActive)).length

  const nameFields = useMemo(() => {
    const fields = [
      {
        key: 'nameAr',
        label: t('categoryDetail.nameAr'),
        value: category?.nameAr || '—',
        dir: 'rtl',
      },
      {
        key: 'nameEn',
        label: t('categoryDetail.nameEn'),
        value: category?.name || '—',
        dir: 'ltr',
      },
    ]
    return language === 'ar' ? fields : [...fields].reverse()
  }, [category, language, t])

  return (
    <AdminDetailShell
      title={displayName || t('categoryDetail.title')}
      subtitle={t('categoryDetail.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.categories'), path: '/admin/categories' },
        { label: displayName || t('categoryDetail.title') },
      ]}
      backTo="/admin/categories"
      backLabel={t('categoryDetail.back')}
      action={
        <button type="button" className="ads-btn ads-btn-primary gap-2" onClick={() => navigate(`/admin/categories/${id}/edit`)}>
          <Pencil size={18} aria-hidden />
          {t('common.edit')}
        </button>
      }
      loading={loading}
      empty={!loading && !category}
      emptyTitle={t('categoryDetail.notFound')}
      noCard
    >
      {category ? (
        <AdminContent className="gap-6">
          <div className="admin-entity-hero">
            <div className="admin-entity-hero__visual">
              {category.image ? (
                <img src={formatImageSrc(category.image)} alt="" className="admin-entity-hero__img" />
              ) : category.icon ? (
                <img src={formatImageSrc(category.icon)} alt="" className="admin-entity-hero__img admin-entity-hero__img--icon" />
              ) : (
                <div className="admin-entity-hero__placeholder">
                  <Layers className="h-12 w-12" aria-hidden />
                </div>
              )}
            </div>
            <div className="admin-entity-hero__body">
              <h2>{displayName}</h2>
              <p className="admin-entity-hero__muted">
                {category.description?.trim() || t('categoryDetail.noDescription')}
              </p>
              <UiStats>
                <UiStat
                  icon={Target}
                  iconTone="indigo"
                  value={category._count?.services ?? 0}
                  label={t('categoryDetail.servicesCount')}
                />
                <UiStat
                  icon={TrendingUp}
                  iconTone="emerald"
                  value={activeServices}
                  label={t('categoryDetail.activeServices')}
                />
              </UiStats>
            </div>
          </div>

          <UiTabs tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'overview' && (
            <div className="admin-service-panels">
              <UiCard>
                <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">
                  {t('categoryDetail.names')}
                </h3>
                <ul className="admin-field-list">
                  {nameFields.map((field) => (
                    <li key={field.key} className="admin-field-list__item">
                      <span className="admin-field-list__label">{field.label}</span>
                      <span className="admin-field-list__value" dir={field.dir}>
                        {field.value}
                      </span>
                    </li>
                  ))}
                </ul>
                <h3 className="mb-4 mt-6 text-base font-bold text-[var(--admin-text)]">
                  {t('categoryDetail.descriptionLabel')}
                </h3>
                <p className="text-[0.9375rem] font-medium leading-relaxed text-[var(--admin-text)]">
                  {category.description?.trim() || t('categoryDetail.noDescription')}
                </p>
              </UiCard>
            </div>
          )}

          {tab === 'services' && (
            <UiCard>
              <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('categoryDetail.servicesInCategory')}</h3>
              {(category.services || []).length === 0 ? (
                <p className="py-10 text-center text-[var(--admin-text-muted)]">{t('categoryDetail.noServices')}</p>
              ) : (
                <UiTable tableClassName="ui-table--venues" minWidth={720}>
                  <thead>
                    <tr>
                      <th className="ui-table-col--name">{t('users.columns.name')}</th>
                      <th className="ui-table-col--provider">{t('roles.provider')}</th>
                      <th className="ui-table-col--price">{t('categoryDetail.price')}</th>
                      <th className="ui-table-col--bookings">{t('nav.bookings')}</th>
                      <th className="ui-table-col--status">{t('common.status')}</th>
                      <th className="ui-table-col--actions text-end">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(category.services || []).map((s) => {
                      const serviceName = language === 'ar' ? s.nameAr || s.name : s.name || s.nameAr
                      const providerName = s.provider
                        ? language === 'ar'
                          ? s.provider.nameAr || s.provider.name
                          : s.provider.name || s.provider.nameAr
                        : '—'
                      const isActive = parseAdminBoolean(s.isActive)

                      return (
                        <tr
                          key={s.id}
                          className="ui-table-row--clickable"
                          onClick={() => navigate(`/admin/services/${s.id}`)}
                        >
                          <td>
                            <span className="ui-table-cell-stack__primary" title={serviceName}>
                              {serviceName}
                            </span>
                          </td>
                          <td>
                            <span className="ui-table-provider" title={providerName}>
                              {providerName}
                            </span>
                          </td>
                          <td>
                            <div className="ui-table-cell-stack ui-table-cell-stack--price">
                              <span className="ui-table-cell-stack__primary tabular-nums">
                                {(s.price ?? 0).toFixed(2)}
                              </span>
                              <span className="ui-table-cell-stack__secondary">{t('dashboard.currency')}</span>
                            </div>
                          </td>
                          <td className="ui-table-cell--nowrap">
                            <span className="ui-table-bookings">{s._count?.bookings ?? 0}</span>
                          </td>
                          <td className="ui-table-cell--nowrap">
                            <Badge variant={isActive ? 'success' : 'danger'} className="ui-badge--nowrap">
                              {isActive ? t('users.active') : t('users.inactive')}
                            </Badge>
                          </td>
                          <td className="ui-table-cell--nowrap">
                            <div className="ui-actions" onClick={(e) => e.stopPropagation()}>
                              <Link to={`/admin/services/${s.id}`} className="ui-action-btn inline-flex">
                                <Eye size={16} aria-hidden />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
