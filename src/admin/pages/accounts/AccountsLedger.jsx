import { useEffect, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { UiCard, UiTable, Badge } from '../../design-system'
import Pagination from '../../components/Pagination'
import { API_URL } from '../../utils/adminSession'

export default function AccountsLedger() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [sourceType, setSourceType] = useState('')
  const [pagination, setPagination] = useState({ currentPage: 1, total: 0, limit: 20, totalPages: 0 })

  const fetchLedger = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (page - 1) * pagination.limit
      const { data } = await axios.get(`${API_URL}/admin/accounts/ledger`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { sourceType: sourceType || undefined, limit: pagination.limit, offset },
      })
      setEntries(data.entries || [])
      setPagination((p) => ({
        ...p,
        currentPage: page,
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / p.limit),
      }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedger(1)
  }, [sourceType])

  return (
    <UiCard>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="text-base font-bold text-[var(--admin-text)]">{t('accounts.nav.ledger')}</h3>
        <select className="admin-input h-10 max-w-[200px]" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
          <option value="">{t('accounts.allSources')}</option>
          <option value="BOOKING_PAYMENT">{t('accounts.sourceBooking')}</option>
          <option value="VENDOR_TRANSACTION">{t('accounts.sourceVendor')}</option>
          <option value="WITHDRAWAL">{t('accounts.sourceWithdrawal')}</option>
          <option value="COMMISSION">{t('accounts.sourceCommission')}</option>
        </select>
      </div>
      {loading ? (
        <p className="py-8 text-center text-[var(--admin-text-muted)]">{t('loading')}</p>
      ) : (
        <>
          <UiTable minWidth={900}>
            <thead>
              <tr>
                <th>{t('accounts.entryNumber')}</th>
                <th>{t('date')}</th>
                <th>{t('accounts.source')}</th>
                <th>{t('description')}</th>
                <th>{t('accounts.lines')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="font-mono text-xs">{e.entryNumber}</td>
                  <td>{new Date(e.date).toLocaleDateString(rtl ? 'ar-SA' : 'en-GB')}</td>
                  <td><Badge variant="info">{e.sourceType}</Badge></td>
                  <td className="max-w-xs truncate text-sm text-[var(--admin-text-muted)]">{e.description}</td>
                  <td>{e.lines?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </UiTable>
          {pagination.totalPages > 1 ? (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={fetchLedger}
              total={pagination.total}
              limit={pagination.limit}
            />
          ) : null}
        </>
      )}
    </UiCard>
  )
}
