import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { UiCard, UiTable } from '../../design-system'
import { API_URL } from '../../utils/adminSession'

export default function AccountsVendorStatement() {
  const { vendorId } = useParams()
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('admin_token')
        const res = await axios.get(`${API_URL}/admin/accounts/vendors/${vendorId}/statement`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100 },
        })
        setData(res.data)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [vendorId])

  const wallet = data?.wallet
  const name = wallet?.user?.vendorProfile?.businessName || wallet?.user?.name || vendorId

  return (
    <div className="flex flex-col gap-4">
      <Link to="/admin/accounts/vendors" className="text-sm text-[var(--admin-text-link)]">
        ← {t('accounts.backVendors')}
      </Link>
      <UiCard>
        <h3 className="mb-2 text-lg font-bold text-[var(--admin-text)]">{name}</h3>
        {wallet ? (
          <p className="text-sm text-[var(--admin-text-muted)]">
            {t('accounts.balance')}: <strong>{wallet.balance.toFixed(2)}</strong> {t('currency')} · {t('accounts.pending')}:{' '}
            {wallet.pendingBalance.toFixed(2)}
          </p>
        ) : null}
      </UiCard>
      <UiCard>
        <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('accounts.statementLines')}</h3>
        {loading ? (
          <p className="py-8 text-center">{t('loading')}</p>
        ) : (
          <UiTable minWidth={800}>
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('accounts.entryNumber')}</th>
                <th>{t('accounts.code')}</th>
                <th>{t('accounts.debit')}</th>
                <th>{t('accounts.credit')}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.lines || []).map((line) => (
                <tr key={line.id}>
                  <td>{new Date(line.entry.date).toLocaleDateString(rtl ? 'ar-SA' : 'en-GB')}</td>
                  <td className="font-mono text-xs">{line.entry.entryNumber}</td>
                  <td>{line.account?.code}</td>
                  <td>{line.debit > 0 ? line.debit.toFixed(2) : '—'}</td>
                  <td>{line.credit > 0 ? line.credit.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </UiTable>
        )}
      </UiCard>
    </div>
  )
}
