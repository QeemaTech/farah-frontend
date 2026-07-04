import { useEffect, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { UiCard, UiTable, Badge } from '../../design-system'
import { API_URL } from '../../utils/adminSession'

export default function AccountsPeriods() {
  const { t } = useTranslation()
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const { data } = await axios.get(`${API_URL}/admin/accounts/periods`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPeriods(data.periods || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const closePeriod = async (id) => {
    if (!window.confirm(t('accounts.confirmClose'))) return
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(`${API_URL}/admin/accounts/periods/${id}/close`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success(t('accounts.periodClosed'))
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || t('accounts.closeFailed'))
    }
  }

  return (
    <UiCard>
      <h3 className="mb-4 text-base font-bold text-[var(--admin-text)]">{t('accounts.nav.periods')}</h3>
      {loading ? (
        <p className="py-8 text-center">{t('loading')}</p>
      ) : (
        <UiTable minWidth={480}>
          <thead>
            <tr>
              <th>{t('accounts.period')}</th>
              <th>{t('status')}</th>
              <th>{t('accounts.closedAt')}</th>
              <th className="text-end">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">
                  {p.year}-{String(p.month).padStart(2, '0')}
                </td>
                <td>
                  <Badge variant={p.status === 'OPEN' ? 'success' : 'neutral'}>{p.status}</Badge>
                </td>
                <td>{p.closedAt ? new Date(p.closedAt).toLocaleString() : '—'}</td>
                <td className="text-end">
                  {p.status === 'OPEN' ? (
                    <button type="button" className="ads-btn ads-btn-subtle text-sm" onClick={() => closePeriod(p.id)}>
                      {t('accounts.closePeriod')}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </UiTable>
      )}
    </UiCard>
  )
}
