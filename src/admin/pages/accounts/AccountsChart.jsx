import { useEffect, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { UiCard, UiTable, Badge } from '../../design-system'
import { API_URL } from '../../utils/adminSession'

export default function AccountsChart() {
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const { data } = await axios.get(`${API_URL}/admin/accounts/chart`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAccounts(data.accounts || [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <UiCard>
      <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('accounts.nav.chart')}</h3>
      {loading ? (
        <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('loading')}</p>
      ) : (
        <UiTable minWidth={720}>
          <thead>
            <tr>
              <th>{t('accounts.code')}</th>
              <th>{t('name')}</th>
              <th>{t('accounts.type')}</th>
              <th>{t('accounts.debit')}</th>
              <th>{t('accounts.credit')}</th>
              <th>{t('accounts.balance')}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td className="font-mono font-semibold">{a.code}</td>
                <td>{language === 'ar' ? a.nameAr || a.name : a.name}</td>
                <td><Badge variant="default">{a.type}</Badge></td>
                <td>{a.debit.toFixed(2)}</td>
                <td>{a.credit.toFixed(2)}</td>
                <td className="font-semibold">{a.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </UiTable>
      )}
    </UiCard>
  )
}
