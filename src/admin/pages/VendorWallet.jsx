import { getPortalHomePath, readAdminUser, toPortalPath, usesProviderApis } from '../utils/adminSession'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { BookOpen, CreditCard, FileText, Wallet } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import { AdminContent, Card, EmptyState, UiStat, UiStats } from '../design-system'
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

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label className="text-xs font-medium text-[var(--admin-text-muted)]">{label}</label>
      ) : null}
      {children}
    </div>
  )
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
  const reportsPath = toPortalPath('/admin/vendor/reports', user)
  const homePath = getPortalHomePath(user)

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
    <Link to={reportsPath} className="ads-btn ads-btn-subtle inline-flex items-center gap-2">
      <FileText className="h-4 w-4" />
      {t('vendorWallet.openReports')}
    </Link>
  )

  if (!isProvider) {
    return (
      <AdminPage title={t('vendorWallet.pageTitle')} layoutTitle={t('vendorWallet.pageTitle')}>
        <EmptyState title={t('messages.error')} description={t('vendorWallet.subtitle')} />
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={t('vendorWallet.pageTitle')}
      layoutTitle={t('vendorWallet.pageTitle')}
      subtitle={t('vendorFinance.privacyNote')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: homePath },
        { label: t('vendorWallet.pageTitle') },
      ]}
      action={reportsLink}
      loading={loading}
    >
      {!loading ? (
        <AdminContent className="gap-6">
          <UiStats className="!grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-4">
            <UiStat
              icon={Wallet}
              iconTone="emerald"
              value={formatCurrency(wallet?.balance || 0, cur)}
              label={t('vendorFinance.currentBalance')}
            />
            <UiStat
              icon={CreditCard}
              iconTone="amber"
              value={formatCurrency(pendingPayoutTotal, cur)}
              label={t('vendorWallet.pendingPayouts')}
            />
            <UiStat
              icon={Wallet}
              iconTone="indigo"
              value={formatCurrency(wallet?.totalEarnings || 0, cur)}
              label={t('vendorFinance.totalEarnings')}
            />
            <UiStat
              icon={CreditCard}
              iconTone="slate"
              value={formatCurrency(wallet?.totalWithdrawn || 0, cur)}
              label={t('vendorFinance.totalWithdrawn')}
            />
          </UiStats>

          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <Card title={t('vendorFinance.payoutTitle')} className="flex h-full flex-col" bodyClassName="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col gap-4">
                <p className="m-0 text-sm leading-relaxed text-[var(--admin-text-muted)]">
                  {t('vendorFinance.payoutHint')}
                </p>
                <div className="rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3.5 py-3 text-sm">
                  <span className="text-[var(--admin-text-muted)]">{t('vendorFinance.maxAvailable')}: </span>
                  <strong className="text-[var(--admin-text)]">{formatCurrency(maxPayout, cur)}</strong>
                </div>
                <form onSubmit={submitPayout} className="mt-auto flex flex-col gap-4">
                  <Field label={t('vendorFinance.bankAccount')}>
                    <select
                      value={payoutBankId}
                      onChange={(e) => setPayoutBankId(e.target.value)}
                      className="admin-input w-full"
                    >
                      <option value="">{t('vendorFinance.bankOptional')}</option>
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} —{' '}
                          {b.accountNumber?.slice(-4)
                            ? `****${String(b.accountNumber).slice(-4)}`
                            : b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('vendorFinance.amount')}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="admin-input w-full"
                    />
                  </Field>
                  <Field label={t('vendorFinance.vendorNote')}>
                    <textarea
                      value={payoutNote}
                      onChange={(e) => setPayoutNote(e.target.value)}
                      rows={3}
                      className="admin-input w-full resize-y min-h-[84px]"
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={payoutSubmitting}
                    className="ads-btn ads-btn-primary mt-1 w-full justify-center disabled:opacity-50"
                  >
                    {t('vendorFinance.submitPayout')}
                  </button>
                </form>
              </div>
            </Card>

            <Card title={t('vendorFinance.addBankTitle')} className="flex h-full flex-col" bodyClassName="flex flex-1 flex-col">
              <div className="flex flex-1 flex-col gap-4">
                {bankAccounts.length === 0 ? (
                  <p className="m-0 rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-200">
                    {t('vendorFinance.noBankAccounts')}
                  </p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {bankAccounts.map((b) => (
                      <li
                        key={b.id}
                        className="rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3.5 py-2.5 text-sm text-[var(--admin-text)]"
                      >
                        <span className="font-medium">{b.bankName}</span>
                        <span className="mx-2 text-[var(--admin-text-muted)]">·</span>
                        <span className="text-[var(--admin-text-muted)]" dir="ltr">
                          {b.accountNumber?.slice(-4)
                            ? `****${String(b.accountNumber).slice(-4)}`
                            : b.accountNumber}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <form onSubmit={addBank} className="mt-auto flex flex-col gap-4">
                  <Field label={t('vendorFinance.bankName')}>
                    <input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="admin-input w-full"
                      placeholder={t('vendorFinance.bankName')}
                    />
                  </Field>
                  <Field label={t('vendorFinance.accountHolder')}>
                    <input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="admin-input w-full"
                      placeholder={t('vendorFinance.accountHolder')}
                    />
                  </Field>
                  <Field label={t('vendorFinance.accountNumber')}>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="admin-input w-full"
                      placeholder={t('vendorFinance.accountNumber')}
                      dir="ltr"
                    />
                  </Field>
                  <Field label={t('vendorFinance.iban')}>
                    <input
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="admin-input w-full"
                      placeholder={t('vendorFinance.iban')}
                      dir="ltr"
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={bankSaving}
                    className="ads-btn ads-btn-subtle mt-1 w-full justify-center disabled:opacity-50"
                  >
                    {t('vendorFinance.saveBank')}
                  </button>
                </form>
              </div>
            </Card>
          </div>

          <Card title={t('vendorFinance.withdrawalsTitle')} noPadding>
            <div className="overflow-x-auto px-0">
              <table className="ui-table min-w-full text-sm">
                <thead className="bg-[var(--admin-bg)] text-start text-[var(--admin-text-muted)]">
                  <tr>
                    <th className="px-5 py-3 font-medium">{t('vendorFinance.amount')}</th>
                    <th className="px-5 py-3 font-medium">{t('vendorFinance.colStatus')}</th>
                    <th className="px-5 py-3 font-medium">{t('vendorFinance.colDate')}</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-t border-[var(--admin-border)]">
                      <td className="px-5 py-3">{formatCurrency(w.amount, cur)}</td>
                      <td className="px-5 py-3">{w.status}</td>
                      <td className="px-5 py-3 text-[var(--admin-text-muted)]">
                        {new Date(w.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-end">
                        {w.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={() => cancelWithdrawal(w.id)}
                            className="text-sm text-rose-400 hover:underline"
                          >
                            {t('vendorFinance.cancelWithdrawal')}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {!withdrawals.length ? (
                    <tr>
                      <td className="px-5 py-10 text-center text-[var(--admin-text-muted)]" colSpan={4}>
                        —
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title={t('vendorWallet.ledgerTitle')}>
            <div className="mb-4 flex flex-col gap-2">
              <p className="m-0 flex items-center gap-2 text-sm text-[var(--admin-text-muted)]">
                <BookOpen className="h-4 w-4 shrink-0 text-[var(--admin-accent)]" aria-hidden />
                {t('vendorWallet.ledgerHint')}
              </p>
              {ledgerSummary ? (
                <p className="m-0 text-xs text-[var(--admin-text-muted)]">
                  {t('vendorWallet.ledgerLines')}: {ledgerSummary.lineCount ?? ledgerLines.length}
                </p>
              ) : null}
            </div>
            <div className="overflow-x-auto rounded-[10px] border border-[var(--admin-border)]">
              <table className="ui-table min-w-full text-sm">
                <thead className="bg-[var(--admin-bg)] text-start text-[var(--admin-text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('accounts.entryNumber')}</th>
                    <th className="px-4 py-3 font-medium">{t('accounts.code')}</th>
                    <th className="px-4 py-3 font-medium">{t('accounts.debit')}</th>
                    <th className="px-4 py-3 font-medium">{t('accounts.credit')}</th>
                    <th className="px-4 py-3 font-medium">{t('vendorFinance.colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerLines.map((line) => (
                    <tr key={line.id} className="border-t border-[var(--admin-border)]">
                      <td className="px-4 py-3 font-mono text-xs">{line.entry?.entryNumber || '—'}</td>
                      <td className="px-4 py-3">{line.account?.code || '—'}</td>
                      <td className="px-4 py-3">{line.debit > 0 ? formatCurrency(line.debit, cur) : '—'}</td>
                      <td className="px-4 py-3">{line.credit > 0 ? formatCurrency(line.credit, cur) : '—'}</td>
                      <td className="px-4 py-3 text-[var(--admin-text-muted)]">
                        {line.entry?.date ? new Date(line.entry.date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {!ledgerLines.length ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-[var(--admin-text-muted)]" colSpan={5}>
                        {t('vendorWallet.ledgerEmpty')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title={t('vendorFinance.recentTx')}>
            <div className="overflow-x-auto rounded-[10px] border border-[var(--admin-border)]">
              <table className="ui-table min-w-full text-sm">
                <thead className="bg-[var(--admin-bg)] text-start text-[var(--admin-text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('vendorFinance.colType')}</th>
                    <th className="px-4 py-3 font-medium">{t('vendorFinance.colCategory')}</th>
                    <th className="px-4 py-3 font-medium">{t('vendorFinance.colAmount')}</th>
                    <th className="px-4 py-3 font-medium">{t('vendorFinance.colStatus')}</th>
                    <th className="px-4 py-3 font-medium">{t('vendorFinance.colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-[var(--admin-border)]">
                      <td className="px-4 py-3">{tx.type}</td>
                      <td className="px-4 py-3">{tx.category}</td>
                      <td className="px-4 py-3">{formatCurrency(tx.amount || 0, cur)}</td>
                      <td className="px-4 py-3">{tx.status}</td>
                      <td className="px-4 py-3 text-[var(--admin-text-muted)]">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {!transactions.length ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-[var(--admin-text-muted)]" colSpan={5}>
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
                className="ads-btn ads-btn-subtle px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {t('vendorFinance.prev')}
              </button>
              <span className="min-w-[3rem] text-center text-sm text-[var(--admin-text-muted)]">
                {txPage} / {pages}
              </span>
              <button
                type="button"
                onClick={() => setTxPage((p) => Math.min(pages, p + 1))}
                disabled={txPage >= pages}
                className="ads-btn ads-btn-subtle px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {t('vendorFinance.next')}
              </button>
            </div>
          </Card>
        </AdminContent>
      ) : null}
    </AdminPage>
  )
}
