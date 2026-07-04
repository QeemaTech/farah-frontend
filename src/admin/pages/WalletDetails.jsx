import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminDetailShell from '../components/AdminDetailShell'
import { AdminContent, Badge, UiCard, UiStat, UiStats, UiTable } from '../design-system'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/currency'
import { BookOpen, Clock, DollarSign, Percent, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { API_URL } from '../utils/adminSession'

const CATEGORY_VARIANT = {
  ORDER_INCOME: 'success',
  BOOKING_INCOME: 'success',
  WITHDRAWAL: 'warning',
  MANUAL_DEPOSIT: 'info',
  COMMISSION_DEDUCTION: 'danger',
  ADJUSTMENT: 'default',
}

const STATUS_VARIANT = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
}

export default function WalletDetails() {
  const { walletId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [txTotal, setTxTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [settings, setSettings] = useState({})
  const [txPage, setTxPage] = useState(1)
  const [txLimit] = useState(15)
  const [filters, setFilters] = useState({ category: '', status: '', dateFrom: '', dateTo: '' })

  useEffect(() => {
    axios.get(`${API_URL}/settings`, { timeout: 5000 }).then((r) => r.data.settings && setSettings(r.data.settings)).catch(() => {})
  }, [])

  useEffect(() => {
    if (walletId) fetchWallet()
  }, [walletId])

  useEffect(() => {
    if (wallet?.vendorId) fetchTransactions()
  }, [wallet?.vendorId, txPage, filters.category, filters.status, filters.dateFrom, filters.dateTo])

  const fetchWallet = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const res = await axios.get(`${API_URL}/admin/wallets/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setWallet(res.data.wallet)
    } catch (err) {
      toast.error(err.response?.data?.error || t('wallets.loadFailed'))
      navigate('/admin/wallets')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!wallet?.vendorId) return
    setTxLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await axios.get(`${API_URL}/admin/vendors/${wallet.vendorId}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: txPage,
          limit: txLimit,
          category: filters.category || undefined,
          status: filters.status || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      })
      setTransactions(res.data.transactions || [])
      setTxTotal(res.data.total || 0)
    } catch {
      setTransactions([])
      setTxTotal(0)
    } finally {
      setTxLoading(false)
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString(rtl ? 'ar-SA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  const v = wallet?.vendor || {}
  const vendorName = v.businessName || v.name || v.nameAr || '—'

  return (
    <AdminDetailShell
      title={t('wallets.detailTitle')}
      subtitle={vendorName}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('wallets.title'), path: '/admin/wallets' },
        { label: t('wallets.detailTitle') },
      ]}
      backTo="/admin/wallets"
      backLabel={t('wallets.title')}
      action={
        wallet?.vendorId ? (
          <Link to={`/admin/accounts/vendors/${wallet.vendorId}`} className="ads-btn ads-btn-subtle gap-2">
            <BookOpen className="h-4 w-4" aria-hidden />
            {t('wallets.linkLedger')}
          </Link>
        ) : null
      }
      loading={loading}
      empty={!loading && !wallet}
      noCard
    >
      {wallet ? (
        <AdminContent className="gap-6">
          <div className="admin-entity-hero admin-entity-hero--compact">
            <div className="admin-entity-hero__visual">
              <div className="admin-entity-hero__placeholder">
                <Wallet className="h-10 w-10 text-[var(--admin-accent)]" aria-hidden />
              </div>
            </div>
            <div className="admin-entity-hero__body">
              <div className="flex flex-wrap items-center gap-2">
                <h2>{vendorName}</h2>
                {wallet.isFrozen ? <Badge variant="danger">{t('wallets.frozen')}</Badge> : <Badge variant="success">{t('active')}</Badge>}
              </div>
              <p className="admin-entity-hero__muted font-mono text-sm">{wallet.id}</p>
              <UiStats>
                <UiStat icon={DollarSign} iconTone="emerald" value={formatCurrency(wallet.balance, settings)} label={t('wallets.colBalance')} />
                <UiStat icon={TrendingUp} iconTone="indigo" value={formatCurrency(wallet.totalEarnings, settings)} label={t('wallets.colEarnings')} />
                <UiStat icon={TrendingDown} iconTone="slate" value={formatCurrency(wallet.totalWithdrawn, settings)} label={t('wallets.colWithdrawn')} />
                <UiStat icon={Clock} iconTone="amber" value={formatCurrency(wallet.pendingBalance, settings)} label={t('wallets.colPending')} />
                <UiStat icon={Percent} iconTone="danger" value={formatCurrency(wallet.totalCommissionPaid, settings)} label={t('wallets.colCommission')} />
              </UiStats>
            </div>
          </div>

          <UiCard>
            <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('wallets.vendorInfo')}</h3>
            <dl className="admin-detail-grid">
              <div className="admin-detail-row">
                <dt className="admin-detail-row__label">{t('wallets.colPhone')}</dt>
                <dd className="admin-detail-row__value" dir="ltr">
                  {v.phone || '—'}
                </dd>
              </div>
              <div className="admin-detail-row">
                <dt className="admin-detail-row__label">{t('email')}</dt>
                <dd className="admin-detail-row__value">{v.email || '—'}</dd>
              </div>
              <div className="admin-detail-row">
                <dt className="admin-detail-row__label">{t('services')}</dt>
                <dd className="admin-detail-row__value">
                  {v.services?.length ? v.services.map((s) => s.name || s.nameAr).join(', ') : '—'}
                </dd>
              </div>
            </dl>
          </UiCard>

          <UiCard>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h3 className="text-base font-bold text-[var(--admin-text)]">{t('wallets.transactions')}</h3>
              <select
                value={filters.category}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, category: e.target.value }))
                  setTxPage(1)
                }}
                className="admin-input h-10 min-w-[140px]"
              >
                <option value="">{t('wallets.allTypes')}</option>
                {['ORDER_INCOME', 'BOOKING_INCOME', 'WITHDRAWAL', 'MANUAL_DEPOSIT', 'COMMISSION_DEDUCTION', 'ADJUSTMENT'].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, status: e.target.value }))
                  setTxPage(1)
                }}
                className="admin-input h-10 min-w-[120px]"
              >
                <option value="">{t('wallets.allStatuses')}</option>
                {['COMPLETED', 'PENDING', 'FAILED'].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, dateFrom: e.target.value }))
                  setTxPage(1)
                }}
                className="admin-input h-10"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, dateTo: e.target.value }))
                  setTxPage(1)
                }}
                className="admin-input h-10"
              />
            </div>
            {txLoading ? (
              <p className="py-12 text-center text-[var(--admin-text-muted)]">{t('loading')}</p>
            ) : !transactions.length ? (
              <p className="py-12 text-center text-[var(--admin-text-muted)]">—</p>
            ) : (
              <>
                <UiTable minWidth={900}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{t('wallets.adjustType')}</th>
                      <th>{t('wallets.amount')}</th>
                      <th>{t('wallets.colCommission')}</th>
                      <th>{t('status')}</th>
                      <th>{t('date')}</th>
                      <th>{t('wallets.note')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="font-mono text-xs">{tx.id?.slice(0, 8)}</td>
                        <td>
                          <Badge variant={CATEGORY_VARIANT[tx.category] || 'default'}>{tx.category}</Badge>
                        </td>
                        <td className="font-semibold">
                          {tx.type === 'CREDIT' ? '+' : '-'}
                          {formatCurrency(tx.amount, settings)}
                        </td>
                        <td>{tx.commission != null ? formatCurrency(tx.commission, settings) : '—'}</td>
                        <td>
                          <Badge variant={STATUS_VARIANT[tx.status] || 'neutral'}>{tx.status}</Badge>
                        </td>
                        <td className="text-sm text-[var(--admin-text-muted)]">{formatDate(tx.createdAt)}</td>
                        <td className="max-w-xs truncate text-sm text-[var(--admin-text-muted)]">{tx.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </UiTable>
                {txTotal > txLimit ? (
                  <Pagination
                    currentPage={txPage}
                    totalPages={Math.ceil(txTotal / txLimit)}
                    onPageChange={setTxPage}
                    total={txTotal}
                    limit={txLimit}
                  />
                ) : null}
              </>
            )}
          </UiCard>
        </AdminContent>
      ) : null}
    </AdminDetailShell>
  )
}
