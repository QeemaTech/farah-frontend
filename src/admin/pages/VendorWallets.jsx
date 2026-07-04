import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/currency'
import { API_URL } from '../utils/adminSession'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  List,
  Eye,
  Send,
  Pencil,
  Lock,
  Unlock,
  Wallet,
  Search,
  RefreshCw,
  BookOpen,
} from 'lucide-react'
import {
  AdminContent,
  Badge,
  SearchInput,
  UiCard,
  UiStat,
  UiStats,
  UiTable,
  UiTableSkeleton,
} from '../design-system'

export default function VendorWallets() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const [wallets, setWallets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ currentPage: 1, total: 0, limit: 20, totalPages: 0 })
  const [settings, setSettings] = useState({})
  const [sendMoneyModal, setSendMoneyModal] = useState({ open: false, vendor: null })
  const [adjustModal, setAdjustModal] = useState({ open: false, vendor: null, wallet: null })
  const [sendForm, setSendForm] = useState({ amount: '', transactionNote: '', paymentMethod: 'Transfer' })
  const [adjustForm, setAdjustForm] = useState({ amount: '', reason: '', type: 'ADD' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    axios.get(`${API_URL}/settings`, { timeout: 5000 }).then((r) => r.data.settings && setSettings(r.data.settings)).catch(() => {})
  }, [])

  useEffect(() => {
    fetchWallets()
  }, [search, pagination.currentPage])

  const fetchWallets = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const res = await axios.get(`${API_URL}/admin/wallets`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pagination.currentPage, limit: pagination.limit, search: search || undefined },
      })
      setWallets(res.data.wallets || [])
      setStats(res.data.stats || null)
      setPagination((prev) => ({
        ...prev,
        total: res.data.total || 0,
        totalPages: Math.ceil((res.data.total || 0) / prev.limit),
      }))
    } catch (err) {
      toast.error(err.response?.data?.error || t('wallets.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendMoney = async (e) => {
    e.preventDefault()
    if (!sendMoneyModal.vendor || !sendForm.amount || parseFloat(sendForm.amount) <= 0) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(
        `${API_URL}/admin/vendors/${sendMoneyModal.vendor.id}/send-money`,
        {
          amount: parseFloat(sendForm.amount),
          transactionNote: sendForm.transactionNote,
          paymentMethod: sendForm.paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(t('wallets.sent'))
      setSendMoneyModal({ open: false, vendor: null })
      setSendForm({ amount: '', transactionNote: '', paymentMethod: 'Transfer' })
      fetchWallets()
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    if (!adjustModal.vendor || !adjustForm.amount || parseFloat(adjustForm.amount) <= 0) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(
        `${API_URL}/admin/wallets/adjust`,
        {
          vendorId: adjustModal.vendor.id,
          amount: parseFloat(adjustForm.amount),
          reason: adjustForm.reason,
          type: adjustForm.type,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(t('wallets.adjusted'))
      setAdjustModal({ open: false, vendor: null, wallet: null })
      setAdjustForm({ amount: '', reason: '', type: 'ADD' })
      fetchWallets()
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const freezeWallet = async (walletId) => {
    if (!window.confirm(t('wallets.confirmFreeze'))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/admin/wallets/${walletId}/freeze`, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(t('wallets.freezeSuccess'))
      fetchWallets()
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    }
  }

  const activateWallet = async (walletId) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/admin/wallets/${walletId}/activate`, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(t('wallets.activated'))
      fetchWallets()
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString(rtl ? 'ar-SA' : 'en-GB', { dateStyle: 'short' }) : '—'

  const toolbar = (
    <>
      <div className="ui-search">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPagination((p) => ({ ...p, currentPage: 1 }))
          }}
          placeholder={t('wallets.searchPh')}
        />
      </div>
      <button type="button" className="ads-btn ads-btn-subtle gap-2" onClick={fetchWallets}>
        <RefreshCw className="h-4 w-4" aria-hidden />
        {t('refresh')}
      </button>
      <Link to="/admin/accounts/vendors" className="ads-btn ads-btn-subtle gap-2">
        <BookOpen className="h-4 w-4" aria-hidden />
        {t('wallets.ledgerLink')}
      </Link>
    </>
  )

  return (
    <AdminPage
      title={t('wallets.title')}
      subtitle={t('wallets.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('wallets.title') },
      ]}
    >
      <AdminContent className="gap-6">
        {stats ? (
          <UiStats>
            <UiStat icon={Wallet} iconTone="indigo" value={formatCurrency(stats.totalVendorsBalance, settings)} label={t('wallets.statBalance')} />
            <UiStat icon={TrendingUp} iconTone="emerald" value={formatCurrency(stats.totalSystemCommission, settings)} label={t('wallets.statCommission')} />
            <UiStat icon={TrendingDown} iconTone="slate" value={formatCurrency(stats.totalWithdrawals, settings)} label={t('wallets.statWithdrawals')} />
            <UiStat icon={Clock} iconTone="amber" value={formatCurrency(stats.pendingWithdrawals, settings)} label={t('wallets.statPending')} />
            <UiStat icon={List} iconTone="indigo" value={stats.totalTransactions ?? 0} label={t('wallets.statTransactions')} />
          </UiStats>
        ) : null}

        <UiCard toolbar={toolbar} ariaLabel={t('wallets.title')}>
          {loading ? (
            <UiTableSkeleton rows={8} cols={8} />
          ) : !wallets.length ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Search className="h-10 w-10 text-[var(--admin-text-muted)] opacity-40" aria-hidden />
              <p className="text-[var(--admin-text-muted)]">{t('wallets.empty')}</p>
            </div>
          ) : (
            <>
              <UiTable minWidth={1100}>
                <thead>
                  <tr>
                    <th>{t('wallets.colVendor')}</th>
                    <th>{t('wallets.colPhone')}</th>
                    <th>{t('wallets.colBalance')}</th>
                    <th>{t('wallets.colEarnings')}</th>
                    <th>{t('wallets.colWithdrawn')}</th>
                    <th>{t('wallets.colPending')}</th>
                    <th>{t('wallets.colCommission')}</th>
                    <th>{t('wallets.colLastTx')}</th>
                    <th>{t('status')}</th>
                    <th className="text-end">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr
                      key={w.id}
                      className="cursor-pointer transition-colors hover:bg-[var(--admin-bg)]/60"
                      onClick={() => navigate(`/admin/wallets/${w.id}`)}
                    >
                      <td>
                        <div className="font-semibold text-[var(--admin-text)]">{w.vendor?.name ?? '—'}</div>
                        <div className="font-mono text-xs text-[var(--admin-text-muted)]">{w.id.slice(0, 8)}…</div>
                      </td>
                      <td className="text-sm" dir="ltr">
                        {w.vendor?.phone ?? '—'}
                      </td>
                      <td className="font-bold text-[var(--admin-accent)]">{formatCurrency(w.balance, settings)}</td>
                      <td>{formatCurrency(w.totalEarnings, settings)}</td>
                      <td>{formatCurrency(w.totalWithdrawn, settings)}</td>
                      <td>{formatCurrency(w.pendingBalance, settings)}</td>
                      <td>{formatCurrency(w.totalCommissionPaid, settings)}</td>
                      <td className="text-sm text-[var(--admin-text-muted)]">{formatDate(w.lastTransactionDate)}</td>
                      <td>
                        {w.isFrozen ? (
                          <Badge variant="danger">{t('wallets.frozen')}</Badge>
                        ) : (
                          <Badge variant="success">{t('active')}</Badge>
                        )}
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="ui-actions justify-end">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/wallets/${w.id}`)}
                            className="ui-action-btn"
                            title={t('view')}
                          >
                            <Eye size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSendMoneyModal({ open: true, vendor: w.vendor })}
                            className="ui-action-btn"
                            title={t('wallets.send')}
                            disabled={w.isFrozen}
                          >
                            <Send size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustModal({ open: true, vendor: w.vendor, wallet: w })}
                            className="ui-action-btn"
                            title={t('wallets.adjust')}
                            disabled={w.isFrozen}
                          >
                            <Pencil size={16} aria-hidden />
                          </button>
                          {w.isFrozen ? (
                            <button type="button" onClick={() => activateWallet(w.id)} className="ui-action-btn" title={t('wallets.activate')}>
                              <Unlock size={16} aria-hidden />
                            </button>
                          ) : (
                            <button type="button" onClick={() => freezeWallet(w.id)} className="ui-action-btn ui-action-btn--danger" title={t('wallets.freeze')}>
                              <Lock size={16} aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </UiTable>
              {pagination.totalPages > 1 ? (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => setPagination((prev) => ({ ...prev, currentPage: p }))}
                  total={pagination.total}
                  limit={pagination.limit}
                />
              ) : null}
            </>
          )}
        </UiCard>
      </AdminContent>

      <Modal isOpen={sendMoneyModal.open} onClose={() => !submitting && setSendMoneyModal({ open: false, vendor: null })} title={t('wallets.sendTitle')}>
        <form onSubmit={handleSendMoney} className="space-y-4">
          {sendMoneyModal.vendor ? (
            <p className="text-sm text-[var(--admin-text-muted)]">
              {t('wallets.vendorLabel')}: <strong className="text-[var(--admin-text)]">{sendMoneyModal.vendor.name}</strong>
            </p>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('wallets.amount')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={sendForm.amount}
              onChange={(e) => setSendForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="admin-input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('wallets.paymentMethod')}</label>
            <select
              value={sendForm.paymentMethod}
              onChange={(e) => setSendForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className="admin-input w-full"
            >
              <option value="Bank">{t('wallets.methodBank')}</option>
              <option value="Cash">{t('wallets.methodCash')}</option>
              <option value="Transfer">{t('wallets.methodTransfer')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('wallets.note')}</label>
            <textarea
              value={sendForm.transactionNote}
              onChange={(e) => setSendForm((prev) => ({ ...prev, transactionNote: e.target.value }))}
              className="admin-input min-h-[5rem] w-full"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSendMoneyModal({ open: false, vendor: null })} className="ads-btn ads-btn-subtle">
              {t('cancel')}
            </button>
            <button type="submit" disabled={submitting} className="ads-btn ads-btn-primary">
              {submitting ? t('messages.saving') : t('wallets.send')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={adjustModal.open}
        onClose={() => !submitting && setAdjustModal({ open: false, vendor: null, wallet: null })}
        title={t('wallets.adjustTitle')}
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          {adjustModal.vendor ? (
            <p className="text-sm text-[var(--admin-text-muted)]">
              {t('wallets.vendorLabel')}: <strong className="text-[var(--admin-text)]">{adjustModal.vendor.name}</strong>
              {adjustModal.wallet ? (
                <span className="mt-1 block">
                  {t('wallets.currentBalance')}: {formatCurrency(adjustModal.wallet.balance, settings)}
                </span>
              ) : null}
            </p>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('wallets.adjustType')}</label>
            <select
              value={adjustForm.type}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, type: e.target.value }))}
              className="admin-input w-full"
            >
              <option value="ADD">{t('wallets.add')}</option>
              <option value="DEDUCT">{t('wallets.deduct')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('wallets.amount')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="admin-input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--admin-text)]">{t('wallets.reason')}</label>
            <input
              type="text"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder={t('wallets.reasonPh')}
              className="admin-input w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdjustModal({ open: false, vendor: null, wallet: null })} className="ads-btn ads-btn-subtle">
              {t('cancel')}
            </button>
            <button type="submit" disabled={submitting} className="ads-btn ads-btn-primary">
              {submitting ? t('messages.saving') : t('wallets.apply')}
            </button>
          </div>
        </form>
      </Modal>
    </AdminPage>
  )
}
