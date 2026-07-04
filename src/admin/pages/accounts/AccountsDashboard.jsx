import { useEffect, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { UiCard, UiStat, UiStats } from '../../design-system'
import { API_URL } from '../../utils/adminSession'
import { DollarSign, BookOpen, Store, TrendingUp, RefreshCw, Database } from 'lucide-react'

export default function AccountsDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const { data } = await axios.get(`${API_URL}/admin/accounts/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats(data.stats)
    } catch (e) {
      toast.error(e.response?.data?.error || t('accounts.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const runBackfill = async () => {
    try {
      setBusy(true)
      const token = localStorage.getItem('admin_token')
      const { data } = await axios.post(`${API_URL}/admin/accounts/backfill?limit=500`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success(
        t('accounts.backfillDone', {
          payments: data.results?.payments,
          vendorTx: data.results?.vendorTx,
          commissions: data.results?.commissions ?? 0,
        }),
      )
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || t('accounts.backfillFailed'))
    } finally {
      setBusy(false)
    }
  }

  const initChart = async () => {
    try {
      setBusy(true)
      const token = localStorage.getItem('admin_token')
      await axios.post(`${API_URL}/admin/accounts/seed-chart`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success(t('accounts.chartReady'))
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || t('accounts.initFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <UiCard><p className="py-12 text-center text-[var(--admin-text-muted)]">{t('loading')}</p></UiCard>
  }

  const L = stats?.ledger || {}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={load} disabled={busy}>
          <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden />
          {t('refresh')}
        </button>
        <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={initChart} disabled={busy}>
          <Database className="h-4 w-4" aria-hidden />
          {t('accounts.initChart')}
        </button>
        <button type="button" className="ads-btn ads-btn-primary gap-2" onClick={runBackfill} disabled={busy}>
          <BookOpen className="h-4 w-4" aria-hidden />
          {t('accounts.runBackfill')}
        </button>
      </div>

      <UiStats>
        <UiStat icon={DollarSign} iconTone="emerald" value={(L.cash?.balance ?? 0).toFixed(2)} label={t('accounts.cashBalance')} />
        <UiStat icon={TrendingUp} iconTone="indigo" value={(L.deferredRevenue?.balance ?? 0).toFixed(2)} label={t('accounts.deferredRevenue')} />
        <UiStat icon={Store} iconTone="amber" value={(L.vendorWalletLiability?.balance ?? 0).toFixed(2)} label={t('accounts.vendorLiability')} />
        <UiStat icon={BookOpen} iconTone="slate" value={stats?.journalEntries ?? 0} label={t('accounts.journalEntries')} />
      </UiStats>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UiCard>
          <h3 className="mb-2 text-sm font-semibold text-[var(--admin-text)]">{t('accounts.paymentsInSystem')}</h3>
          <p className="text-2xl font-bold text-[var(--admin-accent)]">{(stats?.paymentsTotal ?? 0).toFixed(2)} {t('currency')}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{stats?.paymentsRecorded ?? 0} {t('accounts.paidPayments')}</p>
        </UiCard>
        <UiCard>
          <h3 className="mb-2 text-sm font-semibold text-[var(--admin-text)]">{t('accounts.walletsLive')}</h3>
          <p className="text-2xl font-bold text-[var(--admin-text)]">{(stats?.vendorWalletsBalance ?? 0).toFixed(2)}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{t('accounts.pending')}: {(stats?.vendorWalletsPending ?? 0).toFixed(2)}</p>
        </UiCard>
        <UiCard>
          <h3 className="mb-2 text-sm font-semibold text-[var(--admin-text)]">{t('accounts.quickLinks')}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/admin/accounts/ledger" className="text-[var(--admin-text-link)]">{t('accounts.nav.ledger')}</Link></li>
            <li><Link to="/admin/accounts/vendors" className="text-[var(--admin-text-link)]">{t('accounts.nav.vendors')}</Link></li>
            <li><Link to="/admin/accounts/financial" className="text-[var(--admin-text-link)]">{t('accounts.nav.financial')}</Link></li>
            <li><Link to="/admin/reports" className="text-[var(--admin-text-link)]">{t('nav.reports')}</Link></li>
          </ul>
        </UiCard>
      </div>
    </div>
  )
}
