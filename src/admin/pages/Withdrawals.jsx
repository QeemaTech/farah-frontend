import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Clock, Banknote, RefreshCw } from 'lucide-react'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { API_URL } from '../utils/adminSession'
import { formatCurrency } from '../../utils/currency'
import {
  AdminContent,
  Badge,
  SearchInput,
  UiStat,
  UiStats,
  UiTable,
  UiTableSkeleton,
} from '../design-system'

const STATUS_VARIANT = {
  PENDING: 'warning',
  APPROVED: 'info',
  PROCESSING: 'info',
  COMPLETED: 'success',
  REJECTED: 'danger',
}

const STATUS_CHIPS = [
  { value: '', key: 'all' },
  { value: 'PENDING', key: 'pending' },
  { value: 'APPROVED', key: 'approved' },
  { value: 'COMPLETED', key: 'completed' },
  { value: 'REJECTED', key: 'rejected' },
]

export default function Withdrawals() {
  const { t, i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [settings, setSettings] = useState({})
  const [pagination, setPagination] = useState({ currentPage: 1, total: 0, limit: 20, totalPages: 0 })
  const [actionModal, setActionModal] = useState({ open: false, row: null, action: null })
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    axios.get(`${API_URL}/settings`, { timeout: 5000 }).then((r) => r.data.settings && setSettings(r.data.settings)).catch(() => {})
  }, [])

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const res = await axios.get(`${API_URL}/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.currentPage,
          limit: pagination.limit,
          status: statusFilter || undefined,
          search: search || undefined,
        },
      })
      setRows(res.data.withdrawals || [])
      setPagination((prev) => ({
        ...prev,
        total: res.data.total || 0,
        totalPages: Math.ceil((res.data.total || 0) / prev.limit),
      }))
    } catch (err) {
      toast.error(err.response?.data?.error || t('withdrawals.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [pagination.currentPage, pagination.limit, search, statusFilter, t])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const pendingCount = useMemo(() => rows.filter((r) => r.status === 'PENDING').length, [rows])

  const openAction = (row, action) => {
    setActionModal({ open: true, row, action })
    setAdminNote('')
  }

  const closeAction = () => {
    setActionModal({ open: false, row: null, action: null })
    setAdminNote('')
  }

  const submitAction = async () => {
    if (!actionModal.row?.id || !actionModal.action) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${API_URL}/admin/withdrawals/${actionModal.row.id}/${actionModal.action}`,
        { adminNote: adminNote.trim() || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(t(`withdrawals.${actionModal.action}Success`))
      closeAction()
      fetchRows()
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const vendorLabel = (row) => {
    const u = row.user
    if (!u) return '—'
    return rtl
      ? u.vendorProfile?.businessNameAr || u.vendorProfile?.businessName || u.nameAr || u.name
      : u.vendorProfile?.businessName || u.name || u.phone
  }

  return (
    <AdminPage
      title={t('withdrawals.pageTitle')}
      layoutTitle={t('withdrawals.pageTitle')}
      subtitle={t('withdrawals.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('withdrawals.pageTitle') },
      ]}
      action={
        <button type="button" className="ads-btn ads-btn-subtle inline-flex items-center gap-2" onClick={fetchRows}>
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh', { defaultValue: rtl ? 'تحديث' : 'Refresh' })}
        </button>
      }
    >
      <AdminContent className="gap-6">
        <UiStats className="!grid-cols-1 sm:!grid-cols-3">
          <UiStat icon={Clock} iconTone="amber" value={pendingCount} label={t('withdrawals.statPending')} />
          <UiStat icon={CheckCircle} iconTone="emerald" value={rows.filter((r) => r.status === 'COMPLETED').length} label={t('withdrawals.statCompleted')} />
          <UiStat icon={Banknote} iconTone="indigo" value={formatCurrency(rows.reduce((s, r) => s + (r.status === 'PENDING' ? r.amount : 0), 0), settings)} label={t('withdrawals.statPendingAmount')} />
        </UiStats>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder={t('withdrawals.searchPlaceholder')}
            onDebouncedChange={(v) => {
              setSearch(v)
              setPagination((p) => ({ ...p, currentPage: 1 }))
            }}
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_CHIPS.map((chip) => (
              <button
                key={chip.value || 'all'}
                type="button"
                onClick={() => {
                  setStatusFilter(chip.value)
                  setPagination((p) => ({ ...p, currentPage: 1 }))
                }}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  statusFilter === chip.value
                    ? 'bg-[var(--admin-accent)] text-white'
                    : 'border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-accent)]'
                }`}
              >
                {t(`withdrawals.filter.${chip.key}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <UiTableSkeleton rows={6} cols={6} />
        ) : (
          <UiTable>
            <thead>
              <tr>
                <th>{t('withdrawals.colVendor')}</th>
                <th>{t('withdrawals.colAmount')}</th>
                <th>{t('withdrawals.colBank')}</th>
                <th>{t('withdrawals.colStatus')}</th>
                <th>{t('withdrawals.colDate')}</th>
                <th>{t('withdrawals.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-medium text-[var(--admin-text)]">{vendorLabel(row)}</div>
                    <div className="text-xs text-[var(--admin-text-muted)]" dir="ltr">
                      {row.user?.phone || row.user?.email || '—'}
                    </div>
                  </td>
                  <td>{formatCurrency(row.amount, settings)}</td>
                  <td>
                    {row.bankAccount ? (
                      <div className="text-sm">
                        <div>{row.bankAccount.bankName}</div>
                        <div className="text-xs text-[var(--admin-text-muted)]" dir="ltr">
                          {row.bankAccount.accountNumber}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[var(--admin-text-muted)]">—</span>
                    )}
                  </td>
                  <td>
                    <Badge variant={STATUS_VARIANT[row.status] || 'default'}>{row.status}</Badge>
                  </td>
                  <td className="text-[var(--admin-text-muted)]">{new Date(row.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {row.status === 'PENDING' ? (
                        <>
                          <button type="button" className="ads-btn ads-btn-primary text-xs" onClick={() => openAction(row, 'approve')}>
                            {t('withdrawals.approve')}
                          </button>
                          <button type="button" className="ads-btn ads-btn-subtle text-xs text-rose-400" onClick={() => openAction(row, 'reject')}>
                            {t('withdrawals.reject')}
                          </button>
                          <button type="button" className="ads-btn ads-btn-subtle text-xs" onClick={() => openAction(row, 'complete')}>
                            {t('withdrawals.complete')}
                          </button>
                        </>
                      ) : null}
                      {row.status === 'APPROVED' ? (
                        <>
                          <button type="button" className="ads-btn ads-btn-primary text-xs" onClick={() => openAction(row, 'complete')}>
                            {t('withdrawals.complete')}
                          </button>
                          <button type="button" className="ads-btn ads-btn-subtle text-xs text-rose-400" onClick={() => openAction(row, 'reject')}>
                            {t('withdrawals.reject')}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--admin-text-muted)]">
                    {t('withdrawals.empty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </UiTable>
        )}

        {pagination.totalPages > 1 ? (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination((p) => ({ ...p, currentPage: page }))}
          />
        ) : null}
      </AdminContent>

      <Modal
        open={actionModal.open}
        onClose={closeAction}
        title={t(`withdrawals.modal.${actionModal.action || 'approve'}`)}
      >
        <div className="flex flex-col gap-4">
          {actionModal.row ? (
            <p className="text-sm text-[var(--admin-text-muted)]">
              {vendorLabel(actionModal.row)} — {formatCurrency(actionModal.row.amount, settings)}
            </p>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[var(--admin-text-muted)]">{t('withdrawals.adminNote')}</span>
            <textarea
              className="admin-input min-h-[80px] w-full"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={t('withdrawals.adminNotePlaceholder')}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="ads-btn ads-btn-subtle" onClick={closeAction}>
              {t('cancel')}
            </button>
            <button type="button" className="ads-btn ads-btn-primary" disabled={submitting} onClick={submitAction}>
              {submitting ? t('messages.saving') : t('withdrawals.modal.confirm', { defaultValue: rtl ? 'تأكيد' : 'Confirm' })}
            </button>
          </div>
        </div>
      </Modal>
    </AdminPage>
  )
}
