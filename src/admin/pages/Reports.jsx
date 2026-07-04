import { downloadAdminReport } from '../utils/downloadReport'
import { API_URL } from '../utils/adminSession'
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  FileText,
  Plus,
  Download,
  Trash2,
  X,
  Eye,
  Users,
  Calendar,
  Building2,
  Target,
  CreditCard,
  Star,
  Layers,
  Store,
  Wallet,
  ArrowLeftRight,
  Percent,
  BookOpen,
  Beef,
} from 'lucide-react'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Badge, SearchInput, UiCard, UiStat, UiStats } from '../design-system'

const STATUS_VARIANT = {
  PENDING: 'warning',
  GENERATING: 'info',
  COMPLETED: 'success',
  FAILED: 'danger',
}

const ICON_MAP = {
  users: Users,
  vendors: Store,
  bookings: Calendar,
  venues: Building2,
  services: Target,
  categories: Layers,
  payments: CreditCard,
  wallets: Wallet,
  vendor_transactions: ArrowLeftRight,
  commission: Percent,
  accounts: BookOpen,
  reviews: Star,
  slaughter_orders: Beef,
}

const CATEGORY_ORDER = ['users', 'operations', 'marketplace', 'finance', 'quality', 'slaughter']

export default function Reports() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [catalog, setCatalog] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    type: 'USERS',
    resource: 'users',
    format: 'CSV',
    filters: { dateFrom: '', dateTo: '' },
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 10,
    totalPages: 0,
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    axios
      .get(`${API_URL}/reports/catalog`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setCatalog(r.data.catalog || []))
      .catch(() => {})
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      const { data } = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: pagination.limit, offset },
      })
      setReports(data.reports || [])
      setPagination((p) => ({
        ...p,
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / p.limit),
      }))
    } catch {
      toast.error(t('reports.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    const interval = setInterval(fetchReports, 6000)
    return () => clearInterval(interval)
  }, [pagination.currentPage])

  useEffect(() => {
    const gen = searchParams.get('generate')
    if (!gen || !catalog.length) return
    const entry = catalog.find((c) => c.resource === gen)
    if (entry) {
      setFormData((prev) => ({ ...prev, resource: entry.resource, type: entry.type }))
      setShowGenerateForm(true)
      setSearchParams({})
    }
  }, [searchParams, catalog, setSearchParams])

  const groupedCatalog = useMemo(() => {
    const groups = {}
    for (const item of catalog) {
      const cat = item.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return CATEGORY_ORDER.filter((c) => groups[c]).map((cat) => ({
      id: cat,
      label: t(`reports.category.${cat}`),
      items: groups[cat],
    }))
  }, [catalog, t])

  const filteredHistory = reports.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (r.title || r.name || '').toLowerCase().includes(q) ||
      r.resource.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
  })

  const completedCount = reports.filter((r) => r.status === 'COMPLETED').length

  const openGenerate = (entry) => {
    setFormData((prev) => ({
      ...prev,
      resource: entry.resource,
      type: entry.type,
    }))
    setShowGenerateForm(true)
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const token = localStorage.getItem('admin_token')
      const filters = {}
      if (formData.filters.dateFrom) filters.dateFrom = formData.filters.dateFrom
      if (formData.filters.dateTo) filters.dateTo = formData.filters.dateTo
      const { data } = await axios.post(
        `${API_URL}/reports/generate`,
        { ...formData, filters },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setShowGenerateForm(false)
      toast.success(t('reports.generateStarted'))
      fetchReports()
      if (data.report?.id) navigate(`/admin/reports/${data.report.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || t('reports.generateFailed'))
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (report) => {
    try {
      await downloadAdminReport(report)
    } catch (err) {
      toast.error(err.message || t('reports.downloadFailed'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('reports.confirmDelete'))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/reports/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(t('reports.deleted'))
      fetchReports()
    } catch {
      toast.error(t('reports.deleteFailed'))
    }
  }

  const toolbar = (
    <div className="ui-search">
      <SearchInput value={search} onChange={setSearch} placeholder={t('reports.searchPh')} />
    </div>
  )

  return (
    <>
      <AdminPage
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), path: '/admin/dashboard' },
          { label: t('nav.reports') },
        ]}
        action={
          <button type="button" className="ads-btn ads-btn-primary gap-2" onClick={() => setShowGenerateForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('reports.newReport')}
          </button>
        }
      >
        <div className="flex flex-col gap-8">
          <UiStats>
            <UiStat icon={FileText} iconTone="indigo" value={pagination.total} label={t('reports.statTotal')} />
            <UiStat icon={FileText} iconTone="emerald" value={completedCount} label={t('reports.statCompleted')} />
            <UiStat icon={FileText} iconTone="amber" value={catalog.length} label={t('reports.statTypes')} />
          </UiStats>

          <div>
            <h2 className="mb-4 text-lg font-bold text-[var(--admin-text)]">{t('reports.catalogTitle')}</h2>
            <p className="mb-6 text-sm text-[var(--admin-text-muted)]">{t('reports.catalogHint')}</p>
            <div className="flex flex-col gap-8">
              {groupedCatalog.map((group) => (
                <div key={group.id}>
                  <h3 className="admin-reports-category-title">{group.label}</h3>
                  <div className="admin-reports-catalog">
                    {group.items.map((item) => {
                      const Icon = ICON_MAP[item.resource] || FileText
                      return (
                        <article key={item.resource} className="admin-reports-catalog__card">
                          <div className="admin-reports-catalog__head">
                            <Icon className="h-6 w-6 text-[var(--admin-accent)]" aria-hidden />
                            <div className="min-w-0 flex-1">
                              <h4>{rtl ? item.titleAr : item.titleEn}</h4>
                              <p>{rtl ? item.descAr : item.descEn}</p>
                            </div>
                          </div>
                          <div className="admin-reports-catalog__actions">
                            <button type="button" className="ads-btn ads-btn-primary flex-1 text-sm" onClick={() => openGenerate(item)}>
                              {t('reports.generate')}
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <UiCard toolbar={toolbar} ariaLabel={t('reports.historyTitle')}>
            <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('reports.historyTitle')}</h3>
            {loading && !reports.length ? (
              <p className="py-12 text-center text-[var(--admin-text-muted)]">{t('loading')}</p>
            ) : !filteredHistory.length ? (
              <p className="py-12 text-center text-[var(--admin-text-muted)]">{t('reports.empty')}</p>
            ) : (
              <div className="admin-reports-history">
                {filteredHistory.map((report) => (
                  <article key={report.id} className="admin-reports-history__row">
                    <div className="min-w-0 flex-1">
                      <Link to={`/admin/reports/${report.id}`} className="font-semibold text-[var(--admin-text-link)] hover:underline">
                        {rtl ? report.titleAr || report.title || report.name : report.title || report.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
                        {report.resource} · {report.format} · {report.rowCount ?? 0} {t('reports.rows')}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[report.status] || 'neutral'}>{t(`reports.status.${report.status}`)}</Badge>
                    <span className="hidden text-sm text-[var(--admin-text-muted)] sm:inline">
                      {new Date(report.createdAt).toLocaleDateString(rtl ? 'ar-SA' : 'en-GB')}
                    </span>
                    <div className="flex gap-1">
                      <Link to={`/admin/reports/${report.id}`} className="ui-action-btn inline-flex" title={t('reports.view')}>
                        <Eye size={16} aria-hidden />
                      </Link>
                      {report.status === 'COMPLETED' ? (
                        <button type="button" className="ui-action-btn inline-flex" onClick={() => handleDownload(report)} title={t('reports.download')}>
                          <Download size={16} aria-hidden />
                        </button>
                      ) : null}
                      <button type="button" className="ui-action-btn ui-action-btn--danger inline-flex" onClick={() => handleDelete(report.id)} title={t('delete')}>
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {pagination.totalPages > 1 ? (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPagination((prev) => ({ ...prev, currentPage: p }))}
                total={pagination.total}
                limit={pagination.limit}
              />
            ) : null}
          </UiCard>
        </div>
      </AdminPage>

      {showGenerateForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="admin-modal-panel w-full max-w-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--elevation-modal)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--admin-text)]">{t('reports.newReport')}</h3>
              <button type="button" onClick={() => setShowGenerateForm(false)} className="ads-btn ads-btn-icon ads-btn-subtle">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{t('reports.reportType')}</label>
                <select
                  className="admin-input w-full"
                  value={formData.resource}
                  onChange={(e) => {
                    const entry = catalog.find((c) => c.resource === e.target.value)
                    setFormData({
                      ...formData,
                      resource: e.target.value,
                      type: entry?.type || 'CUSTOM',
                    })
                  }}
                  required
                >
                  {catalog.map((c) => (
                    <option key={c.resource} value={c.resource}>
                      {rtl ? c.titleAr : c.titleEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{t('reports.dateFrom')}</label>
                  <input
                    type="date"
                    className="admin-input w-full"
                    value={formData.filters.dateFrom}
                    onChange={(e) => setFormData({ ...formData, filters: { ...formData.filters, dateFrom: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{t('reports.dateTo')}</label>
                  <input
                    type="date"
                    className="admin-input w-full"
                    value={formData.filters.dateTo}
                    onChange={(e) => setFormData({ ...formData, filters: { ...formData.filters, dateTo: e.target.value } })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{t('reports.format')}</label>
                <select
                  className="admin-input w-full"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                >
                  <option value="CSV">CSV</option>
                  <option value="PDF">PDF</option>
                </select>
              </div>
              <p className="text-xs text-[var(--admin-text-muted)]">{t('reports.generateNote')}</p>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={generating} className="ads-btn ads-btn-primary flex-1">
                  {generating ? t('reports.generating') : t('reports.generate')}
                </button>
                <button type="button" onClick={() => setShowGenerateForm(false)} className="ads-btn ads-btn-subtle flex-1">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
