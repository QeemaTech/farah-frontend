import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminPage from '../AdminPage'
import { AdminContent } from '../../design-system'
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Store,
  PieChart,
  Calendar,
} from 'lucide-react'

const LINKS = [
  { to: '/admin/accounts', end: true, icon: LayoutDashboard, key: 'hub' },
  { to: '/admin/accounts/ledger', end: false, icon: BookOpen, key: 'ledger' },
  { to: '/admin/accounts/chart', end: false, icon: Layers, key: 'chart' },
  { to: '/admin/accounts/vendors', end: false, icon: Store, key: 'vendors' },
  { to: '/admin/accounts/financial', end: false, icon: PieChart, key: 'financial' },
  { to: '/admin/accounts/periods', end: false, icon: Calendar, key: 'periods' },
]

export default function AccountsLayout() {
  const { t } = useTranslation()

  return (
    <AdminPage
      title={t('accounts.title')}
      subtitle={t('accounts.subtitle')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('accounts.title') },
      ]}
    >
      <AdminContent className="gap-6">
        <nav className="admin-accounts-nav" aria-label={t('accounts.title')}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `admin-accounts-nav__link ${isActive ? 'is-active' : ''}`}
            >
              <link.icon className="h-4 w-4 shrink-0" aria-hidden />
              {t(`accounts.nav.${link.key}`)}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </AdminContent>
    </AdminPage>
  )
}
