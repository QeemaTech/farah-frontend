import { useState, useEffect } from 'react'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import Pagination from '../components/Pagination'
import { toast } from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'
import { formatCurrency } from '../../utils/currency'
import { DollarSign, Calendar, TrendingUp } from 'lucide-react'
import { API_URL, adminAuthHeaders } from '../utils/adminSession'


export default function CommissionReports() {
  const { language } = useLanguage()
  const [stats, setStats] = useState(null)
  const [table, setTable] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({})
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [page])

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`, { timeout: 5000 })
      if (res.data.settings) setSettings(res.data.settings)
    } catch (_) {}
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const res = await axios.get(`${API_URL}/admin/commission/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit },
      })
      setStats(res.data.stats || null)
      setTable(res.data.table || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'ar' ? 'فشل تحميل تقارير العمولة' : 'Failed to load commission reports'))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB', { dateStyle: 'short' }) : '-')
  const ar = language === 'ar'

  return (
    <AdminPage
      title={ar ? 'عمولة النظام' : 'System commission'}
      breadcrumbs={[
        { label: ar ? 'الرئيسية' : 'Home', path: '/admin/dashboard' },
        { label: ar ? 'عمولة النظام' : 'Commission' },
      ]}
    >
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Calendar className="h-4 w-4 shrink-0" /> {ar ? 'عمولة اليوم' : 'Commission Today'}
              </div>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalCommissionToday, settings)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <TrendingUp className="h-4 w-4 shrink-0" /> {ar ? 'عمولة هذا الشهر' : 'Commission This Month'}
              </div>
              <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(stats.totalCommissionThisMonth, settings)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <DollarSign className="h-4 w-4 shrink-0" /> {ar ? 'إجمالي العمولة' : 'Total Commission All Time'}
              </div>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalCommissionAllTime, settings)}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <h3 className="p-4 border-b border-gray-200 text-lg font-bold text-gray-900">
            {ar ? 'سجل العمولات' : 'Commission Records'}
          </h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-500" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="ui-table w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{ar ? 'رقم الطلب' : 'Order ID'}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{ar ? 'المورد' : 'Vendor'}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{ar ? 'مبلغ الطلب' : 'Order Amount'}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{ar ? 'العمولة' : 'Commission'}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{ar ? 'أرباح المورد' : 'Vendor Earnings'}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{ar ? 'التاريخ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs">{row.orderId?.slice(0, 8)}</td>
                        <td className="py-3 px-4">{row.vendor?.name ?? '-'}</td>
                        <td className="py-3 px-4">{formatCurrency(row.orderAmount, settings)}</td>
                        <td className="py-3 px-4 font-medium text-green-700">{formatCurrency(row.commission, settings)}</td>
                        <td className="py-3 px-4">{formatCurrency(row.vendorEarnings, settings)}</td>
                        <td className="py-3 px-4 text-gray-600">{formatDate(row.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > limit && (
                <div className="p-4 border-t border-gray-200">
                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(total / limit)}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminPage>
  )
}
