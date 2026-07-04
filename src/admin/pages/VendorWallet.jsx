import { readAdminUser, usesProviderApis } from '../utils/adminSession'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { BookOpen, FileText } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import { getSettings, vendorGet, vendorPost, vendorPatch } from '../utils/adminApi'
import { formatCurrency } from '../../utils/currency'

const TX_LIMIT = 10

function currencyShape(settings) {
  if (!settings) {
    return { currencySymbol: 'ر.س', currencyCode: 'SAR', currencyDecimals: 2, currencyPosition: 'AFTER' }
  }
  return {
    currencySymbol: settings.currencySymbol || settings.currencyCode || 'ر.س',
    currencyCode: settings.currencyCode || 'SAR',
    currencyDecimals: settings.currencyDecimals != null ? settings.currencyDecimals : 2,
    currencyPosition: settings.currencyPosition || 'AFTER',
  }
}

export default function VendorWallet() {
  const { t } = useTranslation()
  const user = readAdminUser()
  const isProvider = usesProviderApis(user)

  const [settings, setSettings] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [txPage, setTxPage] = useState(1)
  const [txTotal, setTxTotal] = useState(0)

  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutBankId, setPayoutBankId] = useState('')
  const [payoutNote, setPayoutNote] = useState('')
  const [payoutSubmitting, setPayoutSubmitting] = useState(false)

  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [iban, setIban] = useState('')
  const [bankSaving, setBankSaving] = useState(false)
  const [ledgerLines, setLedgerLines] = useState([])
  const [ledgerSummary, setLedgerSummary] = useState(null)

  const cur = useMemo(() => currencyShape(settings), [settings])

  const load = useCallback(
    async (page = txPage) => {
      if (!isProvider) return
      setLoading(true)
      try {
        const [st, w, t, wd, banks, stmt] = await Promise.all([
          getSettings(8000).catch(() => ({ data: {} })),
          vendorGet('/wallet'),
          vendorGet('/wallet/transactions', { params: { page, limit: TX_LIMIT } }),
          vendorGet('/withdrawals', { params: { page: 1, limit: 30 } }),
          vendorGet('/bank-accounts'),
          vendorGet('/accounts/statement', { params: { limit: 15, offset: 0 } }).catch(() => ({ data: {} })),
        ])
        if (st.data?.settings) setSettings(st.data.settings)
        setWallet(w.data.wallet || null)
        setTransactions(t.data.transactions || [])
        setTxTotal(t.data.total || 0)
        setWithdrawals(wd.data.withdrawals || [])
        setBankAccounts(banks.data.accounts || [])
        setLedgerLines(stmt.data?.lines || [])
        setLedgerSummary(stmt.data?.summary || null)
      } catch {
        toast.error(t('messages.error'))
      } finally {
        setLoading(false)
      }
    },
    [isProvider, t, txPage]
  )

  useEffect(() => {
    if (isProvider) load(txPage)
    else setLoading(false)
  }, [load, txPage, isProvider])

  const pages = Math.max(1, Math.ceil(txTotal / TX_LIMIT))

  const pendingPayoutTotal = useMemo(() => {
    const pend = ['PENDING', 'APPROVED', 'PROCESSING']
    return withdrawals.filter((x) => pend.includes(x.status)).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0)
  }, [withdrawals])

  const maxPayout = useMemo(() => {
    const bal = parseFloat(wallet?.balance) || 0
    return Math.max(0, bal - pendingPayoutTotal)
  }, [wallet?.balance, pendingPayoutTotal])

  const submitPayout = async (e) => {
    e.preventDefault()
    const amt = parseFloat(payoutAmount)
    if (!amt || amt <= 0) {
      toast.error(t('vendorFinance.payoutFailed'))
      return
    }
    if (amt > maxPayout + 1e-6) {
      toast.error(t('vendorFinance.payoutFailed'))
      return
    }
    setPayoutSubmitting(true)
    try {
      await vendorPost('/withdrawals', {
        amount: amt,
        bankAccountId: payoutBankId || undefined,
        vendorNote: payoutNote || undefined,
      })
      toast.success(t('vendorFinance.payoutSuccess'))
      setPayoutAmount('')
      setPayoutNote('')
      await load(txPage)
    } catch (err) {
      toast.error(err.response?.data?.error || t('vendorFinance.payoutFailed'))
    } finally {
      setPayoutSubmitting(false)
    }
  }

  const cancelWithdrawal = async (id) => {
    try {
      await vendorPatch(`/withdrawals/${id}/cancel`, {})
      toast.success(t('vendorFinance.cancelled'))
      await load(txPage)
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    }
  }

  const addBank = async (e) => {
    e.preventDefault()
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      toast.error(t('vendorFinance.bankAddFailed'))
      return
    }
    setBankSaving(true)
    try {
      await vendorPost('/bank-accounts', {
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        iban: iban.trim() || undefined,
        isDefault: bankAccounts.length === 0,
      })
      toast.success(t('vendorFinance.bankAdded'))
      setBankName('')
      setAccountName('')
      setAccountNumber('')
      setIban('')
      await load(txPage)
    } catch (err) {
      toast.error(err.response?.data?.error || t('vendorFinance.bankAddFailed'))
    } finally {
      setBankSaving(false)
    }
  }

  const reportsLink = (
    <Link
      to="/admin/vendor/reports"
      className="admin-btn admin-btn-ghost inline-flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      {t('vendorWallet.openReports')}
    </Link>
  )

  if (!isProvider) {
    return (
      <AdminPage title={t('vendorWallet.pageTitle')} layoutTitle={t('vendorWallet.pageTitle')}>
        <EmptyState
          title={t('messages.error')}
          description={t('vendorWallet.subtitle')}
        />
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={t('vendorWallet.pageTitle')}
      layoutTitle={t('vendorWallet.pageTitle')}
      action={reportsLink}
      loading={loading}
    >
      <p className="-mt-2 text-sm text-[var(--admin-text-muted)]">{t('vendorFinance.privacyNote')}</p>

      {!loading && (
        <>
            <div className="grid gap-4 md:grid-cols-2">
              <StatCard
                label={t('vendorFinance.currentBalance')}
                value={formatCurrency(wallet?.balance || 0, cur)}
              />
              <StatCard
                label={t('vendorWallet.pendingPayouts')}
                value={formatCurrency(pendingPayoutTotal, cur)}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title={t('vendorFinance.payoutTitle')}>
                <p className="mb-4 text-sm text-[var(--admin-text-muted)]">{t('vendorFinance.payoutHint')}</p>
                <p className="mb-2 text-sm text-[var(--admin-text)]">
                  {t('vendorFinance.maxAvailable')}: <strong>{formatCurrency(maxPayout, cur)}</strong>
                </p>
                <form onSubmit={submitPayout} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorFinance.bankAccount')}</label>
                    <select
                      value={payoutBankId}
                      onChange={(e) => setPayoutBankId(e.target.value)}
                      className="admin-input mt-1 w-full"
                    >
                      <option value="">{t('vendorFinance.bankOptional')}</option>
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} —{' '}
                          {b.accountNumber?.slice(-4) ? `****${String(b.accountNumber).slice(-4)}` : b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorFinance.amount')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="admin-input mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--admin-text-muted)]">{t('vendorFinance.vendorNote')}</label>
                    <input
                      type="text"
                      value={payoutNote}
                      onChange={(e) => setPayoutNote(e.target.value)}
                      className="admin-input mt-1 w-full"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={payoutSubmitting}
                    className="w-full rounded-[10px] bg-[var(--admin-accent)] py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
                  >
                    {t('vendorFinance.submitPayout')}
                  </button>
                </form>
              </Card>

              <Card title={t('vendorFinance.addBankTitle')}>
                {bankAccounts.length === 0 ? <p className="mb-3 text-sm text-amber-800">{t('vendorFinance.noBankAccounts')}</p> : null}
                <form onSubmit={addBank} className="space-y-2">
                  <input
                    placeholder={t('vendorFinance.bankName')}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="admin-input w-full"
                  />
                  <input
                    placeholder={t('vendorFinance.accountHolder')}
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="admin-input w-full"
                  />
                  <input
                    placeholder={t('vendorFinance.accountNumber')}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="admin-input w-full"
                  />
                  <input
                    placeholder={t('vendorFinance.iban')}
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="admin-input w-full"
                  />
                  <button
                    type="submit"
                    disabled={bankSaving}
                    className="w-full rounded-[10px] border border-[var(--admin-border)] py-2 text-sm font-medium hover:bg-[var(--admin-bg)] disabled:opacity-50"
                  >
                    {t('vendorFinance.saveBank')}
                  </button>
                </form>
              </Card>
            </div>

            <Card title={t('vendorFinance.withdrawalsTitle')}>
              <div className="overflow-x-auto">
                <table className="ui-table min-w-full text-sm">
                  <thead className="bg-[var(--admin-bg)] text-start text-[var(--admin-text-muted)]">
                    <tr>
                      <th className="px-3 py-2">{t('vendorFinance.amount')}</th>
                      <th className="px-3 py-2">{t('vendorFinance.colStatus')}</th>
                      <th className="px-3 py-2">{t('vendorFinance.colDate')}</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-t border-[var(--admin-border)]">
                        <td className="px-3 py-2">{formatCurrency(w.amount, cur)}</td>
                        <td className="px-3 py-2">{w.status}</td>
                        <td className="px-3 py-2">{new Date(w.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          {w.status === 'PENDING' ? (
                            <button type="button" onClick={() => cancelWithdrawal(w.id)} className="text-sm text-rose-600 hover:underline">
                              {t('vendorFinance.cancelWithdrawal')}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {!withdrawals.length ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-[var(--admin-text-muted)]" colSpan={4}>
                          —
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title={t('vendorWallet.ledgerTitle')}>
              <p className="mb-3 flex items-center gap-2 text-sm text-[var(--admin-text-muted)]">
                <BookOpen className="h-4 w-4 shrink-0 text-[var(--admin-accent)]" aria-hidden />
                {t('vendorWallet.ledgerHint')}
              </p>
              {ledgerSummary ? (
                <p className="mb-3 text-xs text-[var(--admin-text-muted)]">
                  {t('vendorWallet.ledgerLines')}: {ledgerSummary.lineCount ?? ledgerLines.length}
                </p>
              ) : null}
              <div className="overflow-x-auto">
                <table className="ui-table min-w-full text-sm">
                  <thead className="bg-[var(--admin-bg)] text-start text-[var(--admin-text-muted)]">
                    <tr>
                      <th className="px-3 py-2">{t('accounts.entryNumber')}</th>
                      <th className="px-3 py-2">{t('accounts.code')}</th>
                      <th className="px-3 py-2">{t('accounts.debit')}</th>
                      <th className="px-3 py-2">{t('accounts.credit')}</th>
                      <th className="px-3 py-2">{t('vendorFinance.colDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerLines.map((line) => (
                      <tr key={line.id} className="border-t border-[var(--admin-border)]">
                        <td className="px-3 py-2 font-mono text-xs">{line.entry?.entryNumber || '—'}</td>
                        <td className="px-3 py-2">{line.account?.code || '—'}</td>
                        <td className="px-3 py-2">{line.debit > 0 ? formatCurrency(line.debit, cur) : '—'}</td>
                        <td className="px-3 py-2">{line.credit > 0 ? formatCurrency(line.credit, cur) : '—'}</td>
                        <td className="px-3 py-2">
                          {line.entry?.date ? new Date(line.entry.date).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {!ledgerLines.length ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-[var(--admin-text-muted)]" colSpan={5}>
                          {t('vendorWallet.ledgerEmpty')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title={t('vendorFinance.recentTx')}>
              <div className="overflow-x-auto">
                <table className="ui-table min-w-full text-sm">
                  <thead className="bg-[var(--admin-bg)] text-start text-[var(--admin-text-muted)]">
                    <tr>
                      <th className="px-3 py-2">{t('vendorFinance.colType')}</th>
                      <th className="px-3 py-2">{t('vendorFinance.colCategory')}</th>
                      <th className="px-3 py-2">{t('vendorFinance.colAmount')}</th>
                      <th className="px-3 py-2">{t('vendorFinance.colStatus')}</th>
                      <th className="px-3 py-2">{t('vendorFinance.colDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-[var(--admin-border)]">
                        <td className="px-3 py-2">{tx.type}</td>
                        <td className="px-3 py-2">{tx.category}</td>
                        <td className="px-3 py-2">{formatCurrency(tx.amount || 0, cur)}</td>
                        <td className="px-3 py-2">{tx.status}</td>
                        <td className="px-3 py-2">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {!transactions.length ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-[var(--admin-text-muted)]" colSpan={5}>
                          {t('vendorFinance.noTransactions')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage <= 1}
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {t('vendorFinance.prev')}
                </button>
                <span className="text-sm text-[var(--admin-text-muted)]">
                  {txPage} / {pages}
                </span>
                <button
                  type="button"
                  onClick={() => setTxPage((p) => Math.min(pages, p + 1))}
                  disabled={txPage >= pages}
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {t('vendorFinance.next')}
                </button>
              </div>
            </Card>
        </>
      )}
    </AdminPage>
  )
}
