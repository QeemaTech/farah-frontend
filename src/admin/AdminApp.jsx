import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/Dashboard'
import AdminUsers from './pages/Users'
import AdminVenues from './pages/Venues'
import VenueDetails from './pages/VenueDetails'
import AddVenue from './pages/AddVenue'
import EditVenue from './pages/EditVenue'
import VenueBookingCalendar from './pages/VenueBookingCalendar'
import VenueSettings from './pages/VenueSettings'
import AdminServices from './pages/Services'
import ServiceDetails from './pages/ServiceDetails'
import AddService from './pages/AddService'
import EditService from './pages/EditService'
import AdminBookings from './pages/Bookings'
import BookingDetails from './pages/BookingDetails'
import AdminCategories from './pages/Categories'
import CategoryDetails from './pages/CategoryDetails'
import AddCategory from './pages/AddCategory'
import EditCategory from './pages/EditCategory'
import AdminReviews from './pages/Reviews'
import AdminPayments from './pages/Payments'
import AdminReports from './pages/Reports'
import ReportDetails from './pages/ReportDetails'
import AdminRoles from './pages/Roles'
import AdminPermissions from './pages/Permissions'
import AdminNotifications from './pages/NotificationsPage'
import AdminInvoice from './pages/Invoice'
import AdminSettings from './pages/Settings'
import LegalPages from './pages/content/LegalPages'
import AppMediaPages from './pages/content/AppMediaPages'
import Vendors from './pages/Vendors'
import VendorDetails from './pages/VendorDetails'
import VendorsMap from './pages/VendorsMap'
import VendorWallets from './pages/VendorWallets'
import WalletDetails from './pages/WalletDetails'
import CommissionReports from './pages/CommissionReports'
import VendorWallet from './pages/VendorWallet'
import VendorReports from './pages/VendorReports'
import VendorProfileSettings from './pages/VendorProfileSettings'
import VendorTeam from './pages/VendorTeam'
import SlaughterCategories from './pages/SlaughterCategories'
import SlaughterCategoryDetails from './pages/SlaughterCategoryDetails'
import SlaughterInvoiceDetail from './pages/SlaughterInvoiceDetail'
import SlaughterProducts from './pages/SlaughterProducts'
import SlaughterOrders from './pages/SlaughterOrders'
import SlaughterOrderDetail from './pages/SlaughterOrderDetail'
import SlaughterInvoices from './pages/SlaughterInvoices'
import VenueBookings from './pages/VenueBookings'
import VenueBookingDetail from './pages/VenueBookingDetail'
import VenueInvoices from './pages/VenueInvoices'
import SlaughterProductDetails from './pages/SlaughterProductDetails'
import AddSlaughterProduct from './pages/AddSlaughterProduct'
import SlaughterProductsCalculator from './pages/SlaughterProductsCalculator'
import AccountsLayout from './components/accounts/AccountsLayout'
import AccountsDashboard from './pages/accounts/AccountsDashboard'
import AccountsLedger from './pages/accounts/AccountsLedger'
import AccountsChart from './pages/accounts/AccountsChart'
import AccountsVendors from './pages/accounts/AccountsVendors'
import AccountsVendorStatement from './pages/accounts/AccountsVendorStatement'
import AccountsFinancial from './pages/accounts/AccountsFinancial'
import AccountsPeriods from './pages/accounts/AccountsPeriods'
import PermissionRoute from './components/PermissionRoute'
import AdminShell from './components/AdminShell'
import { ThemeProvider } from '../contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { AdminUiThemeProvider } from '../hooks/useTheme'
import { getPortalLoginPath } from './utils/adminSession'

const SLAUGHTER_VENDOR_TYPES = ['SLAUGHTER_PROVIDER']
const VENUE_VENDOR_TYPES = ['VENUE_PROVIDER']
/** Hide generic marketplace routes only for slaughter vendors (other types keep bookings/services/reviews). */
const MARKETPLACE_ISOLATED_VENDOR_TYPES = ['SLAUGHTER_PROVIDER']

function Protected({ children, ...gate }) {
  return <PermissionRoute {...gate}>{children}</PermissionRoute>
}

function AdminToaster() {
  const { i18n } = useTranslation()
  const rtl = i18n.language === 'ar'
  return (
    <Toaster
      position={rtl ? 'top-left' : 'top-right'}
      toastOptions={{
        style: {
          background: 'var(--admin-surface)',
          color: 'var(--admin-text)',
          border: '1px solid var(--admin-border)',
          boxShadow: 'var(--admin-shadow-dropdown)',
        },
      }}
    />
  )
}

function AdminApp() {
  const location = useLocation()
  const loginPath = getPortalLoginPath(location.pathname)

  return (
    <AdminUiThemeProvider>
      <ThemeProvider>
      <Routes>
        {/* Admin Login - Public */}
        <Route path="login" element={<AdminLogin />} />

        {/* Authenticated admin — single layout + Outlet (sidebar stays mounted) */}
        <Route element={<AdminShell />}>
        <Route
          path="dashboard"
          element={
            <Protected permission={{ resource: 'admin', action: 'dashboard' }}>
              <AdminDashboard />
            </Protected>
          }
        />
        <Route
          path="users/customers"
          element={
            <Protected requireFullAdmin>
              <AdminUsers key="admin-users-customers" customersOnly />
            </Protected>
          }
        />
        <Route
          path="users"
          element={
            <Protected requireFullAdmin>
              <AdminUsers key="admin-users-all" />
            </Protected>
          }
        />
        <Route
          path="venues"
          element={
            <Protected permission={{ resource: 'venues', action: 'read' }} hideForVendorTypes={SLAUGHTER_VENDOR_TYPES}>
              <AdminVenues />
            </Protected>
          }
        />
        <Route
          path="venues/add"
          element={
            <Protected permission={{ resource: 'venues', action: 'create' }} vendorTypesOnly={VENUE_VENDOR_TYPES} hideForFullAdmin>
              <AddVenue />
            </Protected>
          }
        />
        <Route
          path="venues/:id/edit"
          element={
            <Protected permission={{ resource: 'venues', action: 'update' }} vendorTypesOnly={VENUE_VENDOR_TYPES} hideForFullAdmin>
              <EditVenue />
            </Protected>
          }
        />
        <Route
          path="venues/:id/calendar"
          element={
            <Protected permission={{ resource: 'venues', action: 'read' }} vendorTypesOnly={VENUE_VENDOR_TYPES} hideForFullAdmin>
              <VenueBookingCalendar />
            </Protected>
          }
        />
        <Route
          path="venues/:id/settings"
          element={
            <Protected permission={{ resource: 'venues', action: 'update' }} vendorTypesOnly={VENUE_VENDOR_TYPES} hideForFullAdmin>
              <VenueSettings />
            </Protected>
          }
        />
        <Route
          path="venues/:id"
          element={
            <Protected permission={{ resource: 'venues', action: 'read' }} hideForVendorTypes={SLAUGHTER_VENDOR_TYPES}>
              <VenueDetails />
            </Protected>
          }
        />
        <Route
          path="services"
          element={
            <Protected permission={{ resource: 'services', action: 'read' }} hideForVendorTypes={MARKETPLACE_ISOLATED_VENDOR_TYPES}>
              <AdminServices />
            </Protected>
          }
        />
        <Route
          path="services/add"
          element={
            <Protected permission={{ resource: 'services', action: 'create' }} hideForVendorTypes={MARKETPLACE_ISOLATED_VENDOR_TYPES}>
              <AddService />
            </Protected>
          }
        />
        <Route
          path="services/:id/edit"
          element={
            <Protected permission={{ resource: 'services', action: 'update' }} hideForVendorTypes={MARKETPLACE_ISOLATED_VENDOR_TYPES}>
              <EditService />
            </Protected>
          }
        />
        <Route
          path="services/:id"
          element={
            <Protected permission={{ resource: 'services', action: 'read' }} hideForVendorTypes={MARKETPLACE_ISOLATED_VENDOR_TYPES}>
              <ServiceDetails />
            </Protected>
          }
        />
        <Route
          path="bookings"
          element={
            <Protected permission={{ resource: 'bookings', action: 'read' }} hideForVendorTypes={MARKETPLACE_ISOLATED_VENDOR_TYPES}>
              <AdminBookings />
            </Protected>
          }
        />
        <Route
          path="bookings/:id"
          element={
            <Protected permission={{ resource: 'bookings', action: 'read' }} hideForVendorTypes={MARKETPLACE_ISOLATED_VENDOR_TYPES}>
              <BookingDetails />
            </Protected>
          }
        />
        <Route
          path="categories"
          element={
            <Protected requireFullAdmin>
              <AdminCategories />
            </Protected>
          }
        />
        <Route
          path="categories/add"
          element={
            <Protected requireFullAdmin>
              <AddCategory />
            </Protected>
          }
        />
        <Route
          path="categories/:id/edit"
          element={
            <Protected requireFullAdmin>
              <EditCategory />
            </Protected>
          }
        />
        <Route
          path="categories/:id"
          element={
            <Protected requireFullAdmin>
              <CategoryDetails />
            </Protected>
          }
        />
        <Route
          path="reviews"
          element={
            <Protected permission={{ resource: 'reviews', action: 'read' }} hideForVendorTypes={MARKETPLACE_ISOLATED_VENDOR_TYPES}>
              <AdminReviews />
            </Protected>
          }
        />
        <Route
          path="payments"
          element={
            <Protected requireFullAdmin>
              <AdminPayments />
            </Protected>
          }
        />
        <Route
          path="reports"
          element={
            <Protected requireFullAdmin>
              <AdminReports />
            </Protected>
          }
        />
        <Route
          path="reports/:id"
          element={
            <Protected requireFullAdmin>
              <ReportDetails />
            </Protected>
          }
        />
        <Route
          path="accounts"
          element={
            <Protected requireFullAdmin>
              <AccountsLayout />
            </Protected>
          }
        >
          <Route index element={<AccountsDashboard />} />
          <Route path="ledger" element={<AccountsLedger />} />
          <Route path="chart" element={<AccountsChart />} />
          <Route path="vendors" element={<AccountsVendors />} />
          <Route path="vendors/:vendorId" element={<AccountsVendorStatement />} />
          <Route path="financial" element={<AccountsFinancial />} />
          <Route path="periods" element={<AccountsPeriods />} />
        </Route>
        <Route
          path="roles"
          element={
            <Protected requireFullAdmin>
              <AdminRoles />
            </Protected>
          }
        />
        <Route
          path="permissions"
          element={
            <Protected requireFullAdmin>
              <AdminPermissions />
            </Protected>
          }
        />
        <Route
          path="notifications"
          element={
            <Protected requireFullAdmin>
              <AdminNotifications />
            </Protected>
          }
        />
        <Route
          path="bookings/:id/invoice"
          element={
            <Protected permission={{ resource: 'bookings', action: 'read' }} hideForVendorTypes={MARKETPLACE_ISOLATED_VENDOR_TYPES}>
              <AdminInvoice />
            </Protected>
          }
        />
        <Route
          path="settings"
          element={
            <Protected requireFullAdmin>
              <AdminSettings />
            </Protected>
          }
        />
        <Route
          path="content/legal"
          element={
            <Protected requireFullAdmin>
              <LegalPages />
            </Protected>
          }
        />
        <Route
          path="content/media"
          element={
            <Protected requireFullAdmin>
              <AppMediaPages />
            </Protected>
          }
        />
        <Route path="about" element={<Navigate to="/admin/content/legal?tab=about" replace />} />
        <Route path="privacy" element={<Navigate to="/admin/content/legal?tab=privacy" replace />} />
        <Route path="terms" element={<Navigate to="/admin/content/legal?tab=terms" replace />} />
        <Route path="sliders" element={<Navigate to="/admin/content/media?tab=sliders" replace />} />
        <Route path="onboarding" element={<Navigate to="/admin/content/media?tab=onboarding" replace />} />
        <Route
          path="vendors"
          element={
            <Protected requireFullAdmin>
              <Vendors />
            </Protected>
          }
        />
        <Route
          path="vendors-map"
          element={
            <Protected requireFullAdmin>
              <VendorsMap />
            </Protected>
          }
        />
        <Route
          path="vendors/:id"
          element={
            <Protected requireFullAdmin>
              <VendorDetails />
            </Protected>
          }
        />
        <Route
          path="wallets"
          element={
            <Protected requireFullAdmin>
              <VendorWallets />
            </Protected>
          }
        />
        <Route
          path="wallets/:walletId"
          element={
            <Protected requireFullAdmin>
              <WalletDetails />
            </Protected>
          }
        />
        <Route
          path="commission"
          element={
            <Protected requireFullAdmin>
              <CommissionReports />
            </Protected>
          }
        />
        <Route
          path="vendor/wallet"
          element={
            <Protected permission={{ resource: 'admin', action: 'dashboard' }} providerPortal>
              <VendorWallet />
            </Protected>
          }
        />
        <Route
          path="vendor/reports"
          element={
            <Protected permission={{ resource: 'admin', action: 'dashboard' }} providerPortal>
              <VendorReports />
            </Protected>
          }
        />
        <Route
          path="vendor/settings"
          element={
            <Protected permission={{ resource: 'admin', action: 'dashboard' }} providerPortal>
              <VendorProfileSettings />
            </Protected>
          }
        />
        <Route
          path="vendor/team"
          element={
            <Protected permission={{ resource: 'admin', action: 'dashboard' }} providerPortal>
              <VendorTeam />
            </Protected>
          }
        />

        <Route
          path="venue/bookings"
          element={
            <Protected permission={{ resource: 'venue_bookings', action: 'read' }}>
              <VenueBookings />
            </Protected>
          }
        />
        <Route
          path="venue/bookings/:id"
          element={
            <Protected permission={{ resource: 'venue_bookings', action: 'read' }}>
              <VenueBookingDetail />
            </Protected>
          }
        />
        <Route
          path="venue/invoices"
          element={
            <Protected permission={{ resource: 'venue_invoices', action: 'read' }}>
              <VenueInvoices />
            </Protected>
          }
        />

        <Route
          path="slaughter/categories"
          element={
            <Protected
              permission={{ resource: 'slaughter_categories', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterCategories />
            </Protected>
          }
        />
        <Route
          path="slaughter/categories/:id"
          element={
            <Protected
              permission={{ resource: 'slaughter_categories', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterCategoryDetails />
            </Protected>
          }
        />
        <Route
          path="slaughter/products"
          element={
            <Protected
              permission={{ resource: 'slaughter_products', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterProducts />
            </Protected>
          }
        />
        <Route
          path="slaughter/products/add"
          element={
            <Protected
              permission={{ resource: 'slaughter_products', action: 'create' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <AddSlaughterProduct />
            </Protected>
          }
        />
        <Route
          path="slaughter/products/calculator"
          element={
            <Protected
              permission={{ resource: 'slaughter_calculator', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterProductsCalculator />
            </Protected>
          }
        />
        <Route
          path="slaughter/products/:id/edit"
          element={
            <Protected
              permission={{ resource: 'slaughter_products', action: 'update' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <AddSlaughterProduct />
            </Protected>
          }
        />
        <Route
          path="slaughter/products/:id"
          element={
            <Protected
              permission={{ resource: 'slaughter_products', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterProductDetails />
            </Protected>
          }
        />
        <Route
          path="slaughter/orders/:orderId"
          element={
            <Protected
              permission={{ resource: 'slaughter_orders', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterOrderDetail />
            </Protected>
          }
        />
        <Route
          path="slaughter/invoices"
          element={
            <Protected
              permission={{ resource: 'slaughter_invoices', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterInvoices />
            </Protected>
          }
        />
        <Route
          path="slaughter/invoices/:id"
          element={
            <Protected
              permission={{ resource: 'slaughter_invoices', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterInvoiceDetail />
            </Protected>
          }
        />
        <Route path="slaughter/team" element={<Navigate to="/admin/vendor/team" replace />} />
        <Route
          path="slaughter/orders"
          element={
            <Protected
              permission={{ resource: 'slaughter_orders', action: 'read' }}
              vendorTypesOnly={SLAUGHTER_VENDOR_TYPES}
            >
              <SlaughterOrders />
            </Protected>
          }
        />
        </Route>

        {/* Redirect empty portal root to login */}
        <Route path="" element={<Navigate to={loginPath} replace />} />
        
        {/* Catch all portal routes - redirect to login */}
        <Route path="*" element={<Navigate to={loginPath} replace />} />
      </Routes>
      <AdminToaster />
    </ThemeProvider>
    </AdminUiThemeProvider>
  )
}

export default AdminApp

