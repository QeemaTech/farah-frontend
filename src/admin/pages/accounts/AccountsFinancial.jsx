import { useEffect, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { UiCard, UiStat, UiStats } from '../../design-system'
import { API_URL } from '../../utils/adminSession'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function AccountsFinancial() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const { data } = await axios.get(`${API_URL}/admin/accounts/reports/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSummary(data.summary)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  if (loading) {
    return <UiCard><p className="py-12 text-center">{t('loading')}</p></UiCard>
  }

  return (
    <div className="flex flex-col gap-6">
      <UiStats>
        <UiStat icon={TrendingUp} iconTone="emerald" value={(summary?.revenue ?? 0).toFixed(2)} label={t('accounts.totalRevenue')} />
        <UiStat icon={TrendingDown} iconTone="danger" value={(summary?.expenses ?? 0).toFixed(2)} label={t('accounts.totalExpenses')} />
        <UiStat icon={DollarSign} iconTone="indigo" value={(summary?.netIncome ?? 0).toFixed(2)} label={t('accounts.netIncome')} />
      </UiStats>
      <UiCard>
        <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('accounts.byAccountType')}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(summary?.byType || {}).map(([type, vals]) => (
            <div key={type} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">{type}</p>
              <p className="mt-1 text-lg font-bold text-[var(--admin-text)]">{vals.balance?.toFixed(2) ?? '0.00'}</p>
            </div>
          ))}
        </div>
      </UiCard>
    </div>
  )
}
