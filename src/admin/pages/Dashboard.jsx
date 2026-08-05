import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { API_URL, isFullAdminUser, isSlaughterOnlyVendor, readAdminUser, getPortalLoginPath } from '../utils/adminSession'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import ChartContainer from '../../components/ui/ChartContainer'
import {
  Users,
  Building2,
  Target,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  FileText,
  ArrowRight,
} from 'lucide-react'
import AdminPage from '../components/AdminPage'
import { Card, StatCard, Badge, AdminContent } from '../design-system'

function Dashboard() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const rtl = i18n.language === 'ar'

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        navigate(getPortalLoginPath(window.location.pathname))
        return
      }
      const user = readAdminUser()
      const headers = { Authorization: `Bearer ${token}` }

      if (isFullAdminUser(user)) {
        const response = await axios.get(`${API_URL}/admin/stats`, { headers })
        setStats(response.data.stats)
      } else if (isSlaughterOnlyVendor(user)) {
        setStats({ providerSlaughterMode: true })
      } else {
        const response = await axios.get(`${API_URL}/mobile/vendor/dashboard`, { headers })
        const s = response.data.stats || {}
        setStats({
          providerVenueMode: true,
          totalVenues: s.venues ?? 0,
          totalServices: s.services ?? 0,
          totalBookings: s.bookings ?? 0,
          totalRevenue: s.totalEarnings ?? 0,
          totalUsers: 0,
          pendingBookings: 0,
          completedBookings: 0,
          monthlyRevenue: 0,
          monthlyBookings: 0,
          adminUsers: 0,
          providerUsers: 0,
          customerUsers: 0,
          recentBookings: [],
          recentUsers: [],
        })
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        navigate(getPortalLoginPath(window.location.pathname))
      }
    } finally {
      setLoading(false)
    }
  }

  const revenueChartData = [
    { name: 'M1', revenue: Math.max(0, (stats?.monthlyRevenue || 0) * 0.2) },
    { name: 'M2', revenue: Math.max(0, (stats?.monthlyRevenue || 0) * 0.45) },
    { name: 'M3', revenue: Math.max(0, (stats?.monthlyRevenue || 0) * 0.7) },
    { name: 'M4', revenue: Math.max(0, stats?.monthlyRevenue || 0) },
    { name: 'M5', revenue: Math.max(0, (stats?.totalRevenue || 0) * 0.35) },
  ]

  const bookingStatusData = [
    { name: t('roles.pending'), value: stats?.pendingBookings || 0 },
    {
      name: t('roles.confirmed'),
      value: Math.max(
        0,
        (stats?.totalBookings || 0) - (stats?.pendingBookings || 0) - (stats?.completedBookings || 0),
      ),
    },
    { name: t('roles.completed'), value: stats?.completedBookings || 0 },
  ]

  const statPrimary = [
    { label: t('dashboard.totalUsers'), value: stats?.totalUsers || 0, icon: Users },
    { label: t('dashboard.totalVenues'), value: stats?.totalVenues || 0, icon: Building2 },
    { label: t('dashboard.totalServices'), value: stats?.totalServices || 0, icon: Target },
    { label: t('dashboard.totalBookings'), value: stats?.totalBookings || 0, icon: Calendar },
  ]

  const statSecondary = [
    {
      label: t('dashboard.totalRevenue'),
      value: `${(stats?.totalRevenue || 0).toFixed(2)} ${t('dashboard.currency')}`,
      icon: DollarSign,
    },
    { label: t('dashboard.pendingBookings'), value: stats?.pendingBookings || 0, icon: Clock },
    { label: t('dashboard.completedBookings'), value: stats?.completedBookings || 0, icon: CheckCircle },
    {
      label: t('dashboard.monthlyRevenue'),
      value: `${(stats?.monthlyRevenue || 0).toFixed(2)} ${t('dashboard.currency')}`,
      icon: TrendingUp,
    },
  ]

  const management = [
    { path: '/admin/users', titleKey: 'manageUsers', descKey: 'manageUsersDesc', Icon: Users, fullAdmin: true },
    { path: '/admin/venues', titleKey: 'manageVenues', descKey: 'manageVenuesDesc', Icon: Building2, hideSlaughter: true },
    { path: '/admin/services', titleKey: 'manageServices', descKey: 'manageServicesDesc', Icon: Target, hideSlaughter: true },
    { path: '/admin/bookings', titleKey: 'manageBookings', descKey: 'manageBookingsDesc', Icon: Calendar, hideSlaughter: true },
    { path: '/admin/categories', titleKey: 'manageCategories', descKey: 'manageCategoriesDesc', Icon: FileText, fullAdmin: true },
    { path: '/admin/reviews', titleKey: 'manageReviews', descKey: 'manageReviewsDesc', Icon: FileText, hideSlaughter: true },
    { path: '/admin/payments', titleKey: 'managePayments', descKey: 'managePaymentsDesc', Icon: DollarSign, fullAdmin: true },
    { path: '/admin/reports', titleKey: 'nav.reports', descKey: 'reportsDesc', Icon: FileText, fullAdmin: true },
    { path: '/admin/slaughter/products', titleKey: 'nav.slaughterProducts', descKey: 'slaughter.statSubtitleTotal', Icon: Target, slaughterOnly: true },
    { path: '/admin/slaughter/orders', titleKey: 'nav.slaughterOrders', descKey: 'slaughterOrders.panelTitle', Icon: Calendar, slaughterOnly: true },
    { path: '/admin/slaughter/products/calculator', titleKey: 'nav.slaughterCalculator', descKey: 'slaughter.calcPageSubtitle', Icon: FileText, slaughterOnly: true },
  ]

  const managementFiltered = management.filter((item) => {
    const u = readAdminUser()
    if (item.fullAdmin && !isFullAdminUser(u)) return false
    if (item.hideSlaughter && isSlaughterOnlyVendor(u)) return false
    if (item.slaughterOnly && !isSlaughterOnlyVendor(u)) return false
    return true
  })

  const bookingBadge = (status) => {
    if (status === 'COMPLETED') return 'success'
    if (status === 'PENDING') return 'warning'
    if (status === 'CONFIRMED') return 'info'
    return 'danger'
  }

  return (
    <AdminPage
      title={t('dashboard.title')}
      subtitle={i18n.language === 'ar' ? 'نظرة عامة على المنصة والإحصائيات' : 'Platform overview and key metrics'}
      breadcrumbs={[{ label: t('nav.dashboard') }]}
      loading={loading}
    >
      <AdminContent>
        <div className="ui-stats">
          {statPrimary.map((s, i) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              iconTone={['indigo', 'emerald', 'amber', 'indigo'][i % 4]}
            />
          ))}
        </div>

        {!stats?.providerSlaughterMode ? (
          <div className="ui-stats">
            {statSecondary.map((s, i) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
                iconTone={['emerald', 'amber', 'indigo', 'emerald'][i % 4]}
              />
            ))}
          </div>
        ) : null}

        {!stats?.providerVenueMode && !stats?.providerSlaughterMode ? (
          <Card title={t('dashboard.usersByRole')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { n: stats?.adminUsers || 0, label: t('roles.admin') },
                { n: stats?.providerUsers || 0, label: t('roles.provider') },
                { n: stats?.customerUsers || 0, label: t('roles.customer') },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[#f8fafc] px-4 py-6 text-center"
                >
                  <p className="text-[28px] font-bold leading-none tracking-tight text-[var(--admin-text)]">{item.n}</p>
                  <p className="mt-2 text-sm font-medium text-[var(--admin-text-muted)]">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {!stats?.providerVenueMode && !stats?.providerSlaughterMode ? (
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            {stats?.recentBookings?.length > 0 && (
              <Card
                title={t('dashboard.recentBookings')}
                action={
                  <button
                    type="button"
                    className="ads-btn ads-btn-link"
                    onClick={() => navigate('/admin/bookings')}
                  >
                    {t('dashboard.viewAll')}
                  </button>
                }
              >
                <ul className="m-0 list-none space-y-2 p-0">
                  {stats.recentBookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                          {booking.bookingNumber}
                        </p>
                        <p className="truncate text-xs text-[var(--admin-text-muted)]">
                          {booking.customer?.name || '—'}
                        </p>
                      </div>
                      <Badge variant={bookingBadge(booking.status)}>
                        {t(`roles.${booking.status || 'PENDING'}`)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {stats?.recentUsers?.length > 0 && (
              <Card
                title={t('dashboard.recentUsers')}
                action={
                  <button
                    type="button"
                    className="ads-btn ads-btn-link"
                    onClick={() => navigate('/admin/users')}
                  >
                    {t('dashboard.viewAll')}
                  </button>
                }
              >
                <ul className="m-0 list-none space-y-2 p-0">
                  {stats.recentUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--admin-text)]">{u.name}</p>
                        <p className="truncate text-xs text-[var(--admin-text-muted)]">{u.phone}</p>
                      </div>
                      <Badge variant={u.role === 'ADMIN' ? 'info' : 'default'}>
                        {t(`roles.${u.role || 'CUSTOMER'}`)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        ) : null}

        {!stats?.providerVenueMode && !stats?.providerSlaughterMode ? (
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title={t('dashboard.revenueChart')}>
              <ChartContainer height={280}>
                {(w, h) => (
                  <ResponsiveContainer width={w} height={h}>
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--admin-surface)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 'var(--admin-radius-control)',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="revenue" fill="var(--admin-accent)" radius={[3, 3, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </Card>

            <Card title={t('dashboard.bookingsStatus')}>
              <ChartContainer height={280}>
                {(w, h) => (
                  <ResponsiveContainer width={w} height={h}>
                    <BarChart data={bookingStatusData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={rtl ? 100 : 88} tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--admin-surface)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 'var(--admin-radius-control)',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="var(--admin-success)" radius={[0, 3, 3, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </Card>
          </div>
        ) : null}

        <Card title={t('dashboard.management')}>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {managementFiltered.map((item) => (
              <button
                key={item.path}
                type="button"
                className="admin-quick-link"
                onClick={() => navigate(item.path)}
              >
                <div className={`flex items-start gap-3 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <div className="admin-quick-link-icon">
                    <item.Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--admin-text)]">{t(item.titleKey)}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--admin-text-muted)]">{t(item.descKey)}</p>
                  </div>
                </div>
                <div
                  className={`mt-4 flex items-center gap-1 border-t border-[var(--admin-border)] pt-3 text-xs font-semibold text-[var(--admin-accent)] ${rtl ? 'justify-end' : ''}`}
                >
                  {t('dashboard.viewAll')}
                  <ArrowRight size={14} className={rtl ? 'rotate-180' : ''} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </AdminContent>
    </AdminPage>
  )
}

export default Dashboard
