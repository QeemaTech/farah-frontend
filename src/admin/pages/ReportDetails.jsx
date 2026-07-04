import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import AdminDetailShell from '../components/AdminDetailShell'
import { AdminContent, Badge, UiCard, UiStat, UiStats, UiTable } from '../design-system'
import { downloadAdminReport } from '../utils/downloadReport'
import { API_URL } from '../utils/adminSession'
import {
  Download,
  FileText,
  RefreshCw,
  AlertCircle,
  BarChart3,
} from 'lucide-react'

const PREVIEW_LIMIT = 200

const STATUS_VARIANT = {
  PENDING: 'warning',
  GENERATING: 'info',
  COMPLETED: 'success',
  FAILED: 'danger',
}

function formatKpiValue(kpi, settings, rtl) {
  if (kpi.format === 'currency') {
    return formatCurrency(Number(kpi.value) || 0, settings || {})
  }
  if (kpi.format === 'number') {
    return Number(kpi.value).toLocaleString(rtl ? 'ar-SA' : 'en-US')
  }
  return String(kpi.value ?? '—')
}

export default function ReportDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const [report, setReport] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const { data } = await axios.get(`${API_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReport(data.report)
      setCatalog(data.catalog)
    } catch (e) {
      toast.error(e.response?.data?.error || t('reports.loadFailed'))
      navigate('/admin/reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    axios.get(`${API_URL}/settings`, { timeout: 5000 }).then((r) => r.data?.settings && setSettings(r.data.settings)).catch(() => {})
    load()
  }, [id])

  useEffect(() => {
    if (!report || report.status === 'COMPLETED' || report.status === 'FAILED') return
    const iv = setInterval(load, 4000)
    return () => clearInterval(iv)
  }, [report?.status])

  const handleDownload = async () => {
    try {
      await downloadAdminReport(report)
    } catch (err) {
      toast.error(err.message || t('reports.downloadFailed'))
    }
  }

  const displayTitle = report
    ? rtl
      ? report.titleAr || report.title || report.name
      : report.title || report.name
    : ''

  const snapshot = report?.snapshot
  const kpis = snapshot?.summary?.kpis || []

  return (
    <AdminDetailShell
      title={displayTitle || t('reports.detailTitle')}
      subtitle={catalog ? (rtl ? catalog.descAr : catalog.descEn) : t('reports.detailSubtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.reports'), path: '/admin/reports' },
        { label: displayTitle || t('reports.detailTitle') },
      ]}
      backTo="/admin/reports"
      backLabel={t('nav.reports')}
      action={
        report?.status === 'COMPLETED' ? (
          <button type="button" className="ads-btn ads-btn-primary gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" aria-hidden />
            {t('reports.download')}
          </button>
        ) : report?.status === 'GENERATING' ? (
          <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
            {t('reports.generating')}
          </button>
        ) : null
      }
      loading={loading}
      empty={!loading && !report}
      emptyTitle={t('reports.notFound')}
      noCard
    >
      {report ? (
        <AdminContent className="gap-6">
          <div className="admin-report-detail-hero">
            <div className="admin-report-detail-hero__icon">
              <FileText className="h-10 w-10 text-[var(--admin-accent)]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--admin-text)]">{displayTitle}</h2>
                <Badge variant={STATUS_VARIANT[report.status] || 'neutral'}>{t(`reports.status.${report.status}`)}</Badge>
                <Badge variant="neutral">{report.format}</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
                {t('reports.metaLine', {
                  author: report.generator?.name || '—',
                  date: new Date(report.createdAt).toLocaleString(rtl ? 'ar-SA' : 'en-GB'),
                  rows: report.rowCount ?? snapshot?.meta?.rowCount ?? 0,
                })}
              </p>
              {report.fileSizeBytes ? (
                <p className="text-xs text-[var(--admin-text-muted)]">
                  {t('reports.fileSize')}: {(report.fileSizeBytes / 1024).toFixed(1)} KB
                </p>
              ) : null}
            </div>
          </div>

          {report.status === 'FAILED' && report.errorMessage ? (
            <UiCard className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex gap-3 text-red-700 dark:text-red-300">
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
                <p className="text-sm">{report.errorMessage}</p>
              </div>
            </UiCard>
          ) : null}

          {report.status === 'GENERATING' ? (
            <UiCard>
              <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('reports.generatingHint')}</p>
            </UiCard>
          ) : null}

          {kpis.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--admin-accent)]" aria-hidden />
                <h3 className="text-base font-bold text-[var(--admin-text)]">{t('reports.executiveSummary')}</h3>
              </div>
              <UiStats>
                {kpis.map((k) => (
                  <UiStat
                    key={k.key}
                    icon={FileText}
                    iconTone="indigo"
                    value={formatKpiValue(k, settings, rtl)}
                    label={rtl ? k.labelAr || k.label : k.label}
                  />
                ))}
              </UiStats>
            </>
          ) : null}

          {snapshot?.summary?.breakdown?.length ? (
            <UiCard>
              <h3 className="mb-3 text-base font-bold text-[var(--admin-text)]">{t('reports.breakdown')}</h3>
              <div className="flex flex-wrap gap-2">
                {snapshot.summary.breakdown.map((b, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-2 text-sm"
                  >
                    <strong>{Object.values(b)[0]}</strong>: {Object.values(b)[1]}
                  </span>
                ))}
              </div>
            </UiCard>
          ) : null}

          {(snapshot?.sections || []).map((sec) => (
            <UiCard key={sec.id}>
              <h3 className="mb-1 text-base font-bold text-[var(--admin-text)]">
                {rtl ? sec.titleAr || sec.title : sec.title}
              </h3>
              {snapshot.meta?.rowCount > PREVIEW_LIMIT && sec.rows?.length >= PREVIEW_LIMIT ? (
                <p className="mb-3 text-xs text-[var(--admin-text-muted)]">{t('reports.previewTruncated')}</p>
              ) : null}
              <UiTable minWidth={700}>
                <thead>
                  <tr>
                    {sec.columns.map((col) => (
                      <th key={col.key}>{rtl ? col.labelAr || col.label : col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(sec.rows || []).map((row, idx) => (
                    <tr key={idx}>
                      {sec.columns.map((col) => (
                        <td key={col.key} className="max-w-xs truncate text-sm">
                          {String(row[col.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </UiTable>
            </UiCard>
          ))}

          {report.status === 'COMPLETED' && !snapshot?.sections?.length ? (
            <UiCard>
              <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('reports.noPreviewData')}</p>
              <p className="text-center">
                <button type="button" className="ads-btn ads-btn-primary gap-2" onClick={handleDownload}>
                  <Download className="h-4 w-4" aria-hidden />
                  {t('reports.download')}
                </button>
              </p>
            </UiCard>
          ) : null}
        </AdminContent>
      ) : null}
    </AdminDetailShell>
  )
}
