import { API_URL } from '../utils/adminSession'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FileBarChart, CreditCard, CheckCircle, Clock } from 'lucide-react'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import ModernListPage from '../components/ModernListPage'
import {
  UiStats,
  UiStat,
  SearchInput,
  UiTable,
  Badge,
  UiChipGroup,
  UiChip,
} from '../design-system'

const STATUS_VARIANT = {
  PENDING: 'warning',
  PAID: 'success',
  REFUNDED: 'info',
  FAILED: 'danger',
}

const STATUS_CHIPS = [
  { value: '', key: 'allStatuses' },
  { value: 'PENDING', key: 'pending' },
  { value: 'PAID', key: 'paid' },
  { value: 'REFUNDED', key: 'refunded' },
  { value: 'FAILED', key: 'failed' },
]

function Payments() {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    limit: 10,
    totalPages: 0,
  })

  useEffect(() => {
    fetchPayments()
  }, [search, filterStatus, filterMethod, pagination.currentPage])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const offset = (pagination.currentPage - 1) * pagination.limit
      const response = await axios.get(`${API_URL}/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          status: filterStatus || undefined,
          method: filterMethod || undefined,
          limit: pagination.limit,
          offset,
        },
      })
      setPayments(response.data.payments || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit),
      }))
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(`${API_URL}/admin/payments/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      fetchPayments()
    } catch (error) {
      toast.error(error.response?.data?.error || t('updateFailed'))
    }
  }

  const getMethodText = (method) => {
    const methodMap = {
      CASH: t('cash', { ar: 'نقدي', en: 'Cash' }),
      CREDIT_CARD: t('creditCard', { ar: 'بطاقة', en: 'Credit Card' }),
      APPLE_PAY: 'Apple Pay',
      GOOGLE_PAY: 'Google Pay',
      VISA: 'Visa',
      MASTERCARD: 'Mastercard',
      PAYPAL: 'PayPal',
    }
    return methodMap[method] || method
  }

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }

  const paidCount = useMemo(() => payments.filter((p) => p.status === 'PAID').length, [payments])
  const pendingCount = useMemo(() => payments.filter((p) => p.status === 'PENDING').length, [payments])

  const toolbar = (
    <>
      <div className="ui-search">
        <SearchInput placeholder={t('searchPayments')} onDebouncedChange={(v) => { setSearch(v); setPagination((p) => ({ ...p, currentPage: 1 })) }} />
      </div>
      <UiChipGroup ariaLabel={t('status')}>
        {STATUS_CHIPS.map((c) => (
          <UiChip
            key={c.value || 'all'}
            active={filterStatus === c.value}
            onClick={() => {
              setFilterStatus(c.value)
              setPagination((p) => ({ ...p, currentPage: 1 }))
            }}
          >
            {t(c.key)}
          </UiChip>
        ))}
      </UiChipGroup>
      <select
        className="admin-input"
        style={{ maxWidth: 200, flex: '0 1 200px' }}
        value={filterMethod}
        onChange={(e) => {
          setFilterMethod(e.target.value)
          setPagination((p) => ({ ...p, currentPage: 1 }))
        }}
        dir={language}
        aria-label={t('paymentMethod', { ar: 'طريقة الدفع', en: 'Payment method' })}
      >
        <option value="">{t('allMethods')}</option>
        <option value="CASH">{t('cash')}</option>
        <option value="CREDIT_CARD">{t('creditCard')}</option>
        <option value="VISA">Visa</option>
        <option value="MASTERCARD">Mastercard</option>
        <option value="APPLE_PAY">Apple Pay</option>
        <option value="GOOGLE_PAY">Google Pay</option>
        <option value="PAYPAL">PayPal</option>
      </select>
    </>
  )

  return (
    <ModernListPage
      title={t('payments', { ar: 'المدفوعات', en: 'Payments' })}
      subtitle={t('paymentsSubtitle', { ar: 'متابعة المدفوعات والمعاملات', en: 'Track payments and transactions' })}
      breadcrumbs={[
        { label: t('nav.dashboard', { ar: 'الرئيسية', en: 'Home' }), path: '/admin/dashboard' },
        { label: t('payments') },
      ]}
      action={
        <button type="button" onClick={() => navigate('/admin/reports?generate=payments')} className="ads-btn ads-btn-subtle gap-2">
          <FileBarChart size={18} aria-hidden />
          {t('report')}
        </button>
      }
      stats={
        <UiStats>
          <UiStat icon={CreditCard} iconTone="indigo" value={pagination.total} label={t('payment', { ar: 'مدفوعات', en: 'Payments' })} />
          <UiStat icon={CheckCircle} iconTone="emerald" value={paidCount} label={t('paid')} />
          <UiStat icon={Clock} iconTone="amber" value={pendingCount} label={t('pending')} />
        </UiStats>
      }
      toolbar={toolbar}
      loading={loading}
      empty={!loading && payments.length === 0}
      emptyTitle={t('noData')}
      emptyDescription={t('searchPayments')}
    >
      <>
        <UiTable minWidth={960}>
          <thead>
            <tr>
              <th>{t('bookingNumber')}</th>
              <th>{t('customer')}</th>
              <th>{t('amount')}</th>
              <th className="hidden md:table-cell">{t('paymentMethod', { ar: 'الطريقة', en: 'Method' })}</th>
              <th className="hidden lg:table-cell">{t('transactionId')}</th>
              <th>{t('status')}</th>
              <th className="hidden sm:table-cell">{t('date')}</th>
              <th className="text-end">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="font-semibold">{payment.booking?.bookingNumber || '—'}</td>
                <td>
                  <div className="ui-user-name">{payment.booking?.customer?.name || '—'}</div>
                  <div className="ui-user-meta">{payment.booking?.customer?.phone || ''}</div>
                </td>
                <td className="font-semibold">
                  {payment.amount?.toFixed(2) || 0} {t('currency')}
                </td>
                <td className="hidden md:table-cell">
                  <Badge variant="default">{getMethodText(payment.method)}</Badge>
                </td>
                <td className="hidden lg:table-cell text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  {payment.transactionId || '—'}
                </td>
                <td>
                  <Badge variant={STATUS_VARIANT[payment.status] || 'default'}>{t(payment.status?.toLowerCase() || 'pending')}</Badge>
                </td>
                <td className="hidden sm:table-cell text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  {new Date(payment.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </td>
                <td>
                  <div className="ui-actions">
                    {payment.status === 'PENDING' ? (
                      <button type="button" onClick={() => updateStatus(payment.id, 'PAID')} className="ads-btn ads-btn-primary" style={{ height: 34, fontSize: 12 }}>
                        {t('confirmPayment', { ar: 'تأكيد', en: 'Confirm' })}
                      </button>
                    ) : null}
                    {payment.status === 'PAID' ? (
                      <button type="button" onClick={() => updateStatus(payment.id, 'REFUNDED')} className="ads-btn ads-btn-subtle" style={{ height: 34, fontSize: 12 }}>
                        {t('refund', { ar: 'استرداد', en: 'Refund' })}
                      </button>
                    ) : null}
                    {payment.status === 'FAILED' ? (
                      <button type="button" onClick={() => updateStatus(payment.id, 'PENDING')} className="ads-btn ads-btn-subtle" style={{ height: 34, fontSize: 12 }}>
                        {t('retry', { ar: 'إعادة', en: 'Retry' })}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </UiTable>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          total={pagination.total}
          limit={pagination.limit}
        />
      </>
    </ModernListPage>
  )
}

export default Payments
