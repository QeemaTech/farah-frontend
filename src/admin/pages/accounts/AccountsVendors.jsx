import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { UiCard, UiTable, Badge } from '../../design-system'
import { API_URL } from '../../utils/adminSession'
import { Eye } from 'lucide-react'

export default function AccountsVendors() {
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const { data } = await axios.get(`${API_URL}/admin/accounts/vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setVendors(data.vendors || [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <UiCard>
      <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('accounts.vendorBalances')}</h3>
      {loading ? (
        <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('loading')}</p>
      ) : (
        <UiTable minWidth={800}>
          <thead>
            <tr>
              <th>{t('vendor')}</th>
              <th>{t('accounts.type')}</th>
              <th>{t('accounts.balance')}</th>
              <th>{t('accounts.pending')}</th>
              <th>{t('accounts.earnings')}</th>
              <th>{t('status')}</th>
              <th className="text-end">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              const name =
                v.user?.vendorProfile?.businessName ||
                v.user?.vendorProfile?.businessNameAr ||
                v.user?.name ||
                '—'
              return (
                <tr key={v.vendorId}>
                  <td className="font-medium">{name}</td>
                  <td className="text-sm text-[var(--admin-text-muted)]">{v.user?.vendorProfile?.vendorType || '—'}</td>
                  <td>{v.balance.toFixed(2)}</td>
                  <td>{v.pendingBalance.toFixed(2)}</td>
                  <td>{v.totalEarnings.toFixed(2)}</td>
                  <td>
                    {v.isFrozen ? <Badge variant="danger">{t('accounts.frozen')}</Badge> : <Badge variant="success">{t('active')}</Badge>}
                  </td>
                  <td className="text-end">
                    <Link to={`/admin/accounts/vendors/${v.vendorId}`} className="ui-action-btn inline-flex">
                      <Eye size={16} aria-hidden />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </UiTable>
      )}
    </UiCard>
  )
}
