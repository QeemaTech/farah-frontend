import { readAdminUser, usesProviderApis } from '../utils/adminSession'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { CreditCard } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import { getSettings, vendorGet } from '../utils/adminApi'
import { formatCurrency } from '../../utils/currency'

const PERIODS = [
  { value: 'all', key: 'periodAll' },
  { value: 'today', key: 'periodToday' },
  { value: 'week', key: 'periodWeek' },
  { value: 'month', key: 'periodMonth' },
  { value: 'year', key: 'periodYear' },
]

const EXPORT_TX_LIMIT = 500
const EXPORT_ORDER_LIMIT = 200

function currencyShape(settings) {
  if (!settings) {
    return { currencySymbol: 'ر.س', currencyCode: 'SAR', currencyDecimals: 2, currencyPosition: 'AFTER' }
  }
  return {
    currencySymbol: settings.currencySymbol || settings.currencyCode || 'ر.س',
    currencyCode: settings.currencyCode || 'SAR',
    currencyDecimals: settings.currencyDecimals != null ? settings.currencyDecimals : 2,
    currencyPosition: settings.currencyPosition || 'AFTER',
    commissionType: settings.commissionType,
    commissionValue: settings.commissionValue,
  }
}

function csvEscape(v) {
  const s = v == null ? '' : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowsToCsv(rows) {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const header = keys.map(csvEscape).join(',')
  const lines = rows.map((r) => keys.map((k) => csvEscape(r[k])).join(','))
  return [header, ...lines].join('\n')
}

export default function VendorReports() {
  const { t } = useTranslation()
  const user = readAdminUser()
  const isProvider = usesProviderApis(user)

  const [settings, setSettings] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportPeriod, setReportPeriod] = useState('month')

  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeWithdrawals, setIncludeWithdrawals] = useState(true)
  const [includeTransactions, setIncludeTransactions] = useState(true)
  const [includeOrders, setIncludeOrders] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)

  const cur = useMemo(() => currencyShape(settings), [settings])

  const reportParams = useMemo(
    () => (reportPeriod && reportPeriod !== 'all' ? { period: reportPeriod } : {}),
    [reportPeriod],
  )

  const load = useCallback(async () => {
    if (!isProvider) return
    setLoading(true)
    try {
      const [st, w, r] = await Promise.all([
        getSettings(8000).catch(() => ({ data: {} })),
        vendorGet('/wallet'),
        vendorGet('/financial-report', { params: reportParams }),
      ])
      if (st.data?.settings) setSettings(st.data.settings)
      setWallet(w.data.wallet || null)
      setReport(r.data.report || null)
    } catch {
      toast.error(t('messages.error'))
    } finally {
      setLoading(false)
    }
  }, [isProvider, reportParams, t])

  useEffect(() => {
    if (isProvider) load()
    else setLoading(false)
  }, [load, isProvider])

  const effectiveCommissionPct = useMemo(() => {
    const inc = report?.income?.total || 0
    const com = report?.commission?.total || 0
    if (inc <= 0) return null
    return (com / inc) * 100
  }, [report])

  const commissionRuleText = useMemo(() => {
    if (!settings) return '—'
    if (settings.commissionType === 'FIXED') {
      return t('vendorFinance.commissionFixed', { value: formatCurrency(settings.commissionValue || 0, cur) })
    }
    return t('vendorFinance.commissionPercent', { value: settings.commissionValue ?? '—' })
  }, [settings, t, cur])

  const ordersByStatus = report?.orders && typeof report.orders === 'object' ? report.orders : {}

  const buildExportPayload = async () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      period: reportPeriod,
      vendor: { id: user?.id, name: user?.name, email: user?.email },
      currency: cur,
    }
    if (includeSummary) {
      payload.wallet = wallet
      payload.financialReport = report
    }
    if (includeWithdrawals) {
      const wd = await vendorGet('/withdrawals', { params: { page: 1, limit: 200 } })
      payload.withdrawals = wd.data.withdrawals || []
    }
    if (includeTransactions) {
      const tx = await vendorGet('/wallet/transactions', { params: { page: 1, limit: EXPORT_TX_LIMIT } })
      payload.transactions = tx.data.transactions || []
      payload.transactionsTotal = tx.data.total
    }
    if (includeOrders) {
      const ord = await vendorGet('/orders', { params: { page: 1, limit: EXPORT_ORDER_LIMIT } })
      payload.orders = ord.data.orders || []
      payload.ordersTotal = ord.data.total
    }
    return payload
  }

  const exportJson = async () => {
    setExportBusy(true)
    try {
      const payload = await buildExportPayload()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `vendor-report-${user?.id || 'me'}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.success(t('vendorReports.exportDone'))
    } catch {
      toast.error(t('messages.error'))
    } finally {
      setExportBusy(false)
    }
  }

  const exportCsvPack = async () => {
    setExportBusy(true)
    try {
      const payload = await buildExportPayload()
      const zipName = `vendor-report-${user?.id || 'me'}-${Date.now()}`
      if (payload.transactions?.length) {
        const txRows = payload.transactions.map((x) => ({
          id: x.id,
          type: x.type,
          category: x.category,
          amount: x.amount,
          status: x.status,
          createdAt: x.createdAt,
        }))
        downloadText(`${zipName}-transactions.csv`, rowsToCsv(txRows), 'text/csv;charset=utf-8')
      }
      if (payload.withdrawals?.length) {
        const wdRows = payload.withdrawals.map((x) => ({
          id: x.id,
          amount: x.amount,
          status: x.status,
          createdAt: x.createdAt,
        }))
        downloadText(`${zipName}-withdrawals.csv`, rowsToCsv(wdRows), 'text/csv;charset=utf-8')
      }
      if (payload.orders?.length) {
        const oRows = payload.orders.map((o) => ({
          id: o.id,
          status: o.status,
          total: o.totalAmount,
          createdAt: o.createdAt,
        }))
        downloadText(`${zipName}-orders.csv`, rowsToCsv(oRows), 'text/csv;charset=utf-8')
      }
      if (payload.financialReport) {
        const summary = [
          { key: 'period', value: payload.period },
          { key: 'income', value: payload.financialReport.income?.total },
          { key: 'commission', value: payload.financialReport.commission?.total },
          { key: 'withdrawals', value: payload.financialReport.withdrawals?.total },
          { key: 'balance', value: payload.financialReport.wallet?.balance },
        ]
        downloadText(`${zipName}-summary.csv`, rowsToCsv(summary), 'text/csv;charset=utf-8')
      }
      toast.success(t('vendorReports.exportDone'))
    } catch {
      toast.error(t('messages.error'))
    } finally {
      setExportBusy(false)
    }
  }

  function downloadText(filename, text, mime) {
    const blob = new Blob([text], { type: mime })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const walletLink = (
    <Link to="/admin/vendor/wallet" className="admin-btn admin-btn-ghost inline-flex items-center gap-2">
      <CreditCard className="h-4 w-4" />
      {t('vendorReports.openWallet')}
    </Link>
  )

  const periodSelect = (
    <select
      value={reportPeriod}
      onChange={(e) => setReportPeriod(e.target.value)}
      className="admin-input max-w-xs"
    >
      {PERIODS.map((p) => (
        <option key={p.value} value={p.value}>
          {t(`vendorFinance.${p.key}`)}
        </option>
      ))}
    </select>
  )

  if (!isProvider) {
    return (
      <AdminPage title={t('vendorReports.pageTitle')} layoutTitle={t('vendorReports.pageTitle')}>
        <EmptyState title={t('messages.error')} description={t('vendorReports.subtitle')} />
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={t('vendorReports.pageTitle')}
      layoutTitle={t('vendorReports.pageTitle')}
      action={walletLink}
      loading={loading}
    >
      <div id="vendor-reports-root" className="space-y-6 print:space-y-4">
        <p className="-mt-2 text-sm text-[var(--admin-text-muted)]">{t('vendorFinance.privacyNote')}</p>

        {!loading && (
          <>
            <Card className="print:hidden" title={t('vendorReports.customExport')}>
              <p className="mb-4 text-sm text-[var(--admin-text-muted)]">{t('vendorReports.customExportHint')}</p>
              <div className="flex flex-wrap gap-4 text-sm text-[var(--admin-text)]">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} />
                  {t('vendorReports.optSummary')}
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={includeWithdrawals} onChange={(e) => setIncludeWithdrawals(e.target.checked)} />
                  {t('vendorReports.optWithdrawals')}
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={includeTransactions} onChange={(e) => setIncludeTransactions(e.target.checked)} />
                  {t('vendorReports.optTransactions', { n: EXPORT_TX_LIMIT })}
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={includeOrders} onChange={(e) => setIncludeOrders(e.target.checked)} />
                  {t('vendorReports.optOrders', { n: EXPORT_ORDER_LIMIT })}
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={exportBusy}
                  onClick={exportJson}
                  className="rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm hover:bg-[var(--admin-surface)] disabled:opacity-50"
                >
                  {t('vendorFinance.exportJson')}
                </button>
                <button
                  type="button"
                  disabled={exportBusy}
                  onClick={exportCsvPack}
                  className="rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm hover:bg-[var(--admin-surface)] disabled:opacity-50"
                >
                  {t('vendorReports.downloadCsv')}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm hover:bg-[var(--admin-surface)]"
                >
                  {t('vendorFinance.printReport')}
                </button>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-2">
              <StatCard label={t('vendorFinance.currentBalance')} value={formatCurrency(wallet?.balance || 0, cur)} index={0} />
              <StatCard label={t('vendorFinance.totalEarnings')} value={formatCurrency(report?.wallet?.totalEarnings || 0, cur)} index={1} />
              <StatCard label={t('vendorFinance.commissionPaid')} value={formatCurrency(report?.wallet?.totalCommissionPaid || 0, cur)} index={2} />
              <StatCard label={t('vendorFinance.pendingBalance')} value={formatCurrency(report?.wallet?.pendingBalance || 0, cur)} index={3} />
            </div>

            <Card
              className="print:break-inside-avoid"
              title={t('vendorFinance.periodLabel')}
              action={periodSelect}
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-[var(--admin-bg)] p-3">
                  <p className="text-xs text-[var(--admin-text-muted)]">{t('vendorFinance.periodIncome')}</p>
                  <p className="mt-1 font-semibold text-[var(--admin-text)]">{formatCurrency(report?.income?.total || 0, cur)}</p>
                </div>
                <div className="rounded-lg bg-[var(--admin-bg)] p-3">
                  <p className="text-xs text-[var(--admin-text-muted)]">{t('vendorFinance.periodCommission')}</p>
                  <p className="mt-1 font-semibold text-amber-800">{formatCurrency(report?.commission?.total || 0, cur)}</p>
                </div>
                <div className="rounded-lg bg-[var(--admin-bg)] p-3">
                  <p className="text-xs text-[var(--admin-text-muted)]">{t('vendorFinance.periodWithdrawals')}</p>
                  <p className="mt-1 font-semibold text-[var(--admin-text)]">{formatCurrency(report?.withdrawals?.total || 0, cur)}</p>
                </div>
                <div className="rounded-lg bg-[var(--admin-bg)] p-3">
                  <p className="text-xs text-[var(--admin-text-muted)]">{t('vendorFinance.totalWithdrawn')}</p>
                  <p className="mt-1 font-semibold text-[var(--admin-text)]">
                    {formatCurrency(report?.wallet?.totalWithdrawn || 0, cur)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                  <p className="text-xs font-medium text-indigo-900">{t('vendorFinance.systemCommissionRule')}</p>
                  <p className="mt-1 text-sm text-indigo-950">{commissionRuleText}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-700">{t('vendorFinance.effectiveCommissionRate')}</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {effectiveCommissionPct != null ? `${effectiveCommissionPct.toFixed(1)}%` : '—'}
                  </p>
                </div>
              </div>

              {Object.keys(ordersByStatus).length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-[var(--admin-text)]">{t('vendorFinance.ordersByStatus')}</p>
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {Object.entries(ordersByStatus).map(([status, count]) => (
                      <li key={status} className="rounded-full bg-[var(--admin-bg)] px-3 py-1 text-[var(--admin-text)]">
                        {status}: {count}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          </>
        )}
      </div>
    </AdminPage>
  )
}
