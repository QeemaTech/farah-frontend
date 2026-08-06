import {
  LayoutDashboard,
  Building2,
  Target,
  Calendar,
  Folder,
  Package,
  Users,
  Star,
  CreditCard,
  FileText,
  Shield,
  Lock,
  Bell,
  Settings,
  Image,
  MapPin,
  Percent,
  Calculator,
  UserCog,
  ScrollText,
  Wallet,
  Store,
  BookOpen,
  Banknote,
} from 'lucide-react'
import { hasPermission, isFullAdminUser, toPortalPath } from '../../admin/utils/adminSession'

const SLAUGHTER = ['SLAUGHTER_PROVIDER']
const VENUE_ONLY = ['VENUE_PROVIDER']
const MARKETPLACE_ISOLATED = ['SLAUGHTER_PROVIDER']

/** Sidebar section order and labels (i18n keys). */
export const NAV_SECTION_ORDER = ['core', 'slaughter', 'venue', 'users', 'finance', 'provider', 'content', 'system']

export const NAV_SECTION_LABELS = {
  core: 'nav.section.core',
  slaughter: 'nav.section.slaughter',
  venue: 'nav.section.venue',
  users: 'nav.section.users',
  finance: 'nav.section.finance',
  provider: 'nav.section.provider',
  content: 'nav.section.content',
  system: 'nav.section.system',
}

/** Icon shown on collapsible sidebar group headers */
export const NAV_SECTION_ICONS = {
  core: Building2,
  slaughter: Package,
  venue: Building2,
  users: Users,
  finance: Wallet,
  provider: Store,
  content: ScrollText,
  system: Settings,
}

/** @typedef {{ path: string, labelKey: string, icon: import('lucide-react').LucideIcon, section?: string, requireFullAdmin?: boolean, permission?: { resource: string, action: string }, hideForVendorTypes?: string[], vendorTypesOnly?: string[], providerPortal?: boolean }} NavItemDef */

/** @type {NavItemDef[]} */
export const ADMIN_NAV_ITEMS = [
  { path: '/admin/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, section: 'core', permission: { resource: 'admin', action: 'dashboard' } },
  { path: '/admin/venues', labelKey: 'nav.venues', icon: Building2, section: 'core', permission: { resource: 'venues', action: 'read' }, hideForVendorTypes: SLAUGHTER },
  { path: '/admin/services', labelKey: 'nav.services', icon: Target, section: 'core', permission: { resource: 'services', action: 'read' }, hideForVendorTypes: MARKETPLACE_ISOLATED },
  { path: '/admin/bookings', labelKey: 'nav.bookings', icon: Calendar, section: 'core', permission: { resource: 'bookings', action: 'read' }, hideForVendorTypes: MARKETPLACE_ISOLATED },
  { path: '/admin/categories', labelKey: 'nav.categories', icon: Folder, section: 'core', requireFullAdmin: true },

  { path: '/admin/slaughter/orders', labelKey: 'nav.slaughterOrders', icon: Package, section: 'slaughter', permission: { resource: 'slaughter_orders', action: 'read' }, vendorTypesOnly: SLAUGHTER },
  { path: '/admin/slaughter/invoices', labelKey: 'nav.slaughterInvoices', icon: FileText, section: 'slaughter', permission: { resource: 'slaughter_invoices', action: 'read' }, vendorTypesOnly: SLAUGHTER },
  { path: '/admin/slaughter/products', labelKey: 'nav.slaughterProducts', icon: Target, section: 'slaughter', permission: { resource: 'slaughter_products', action: 'read' }, vendorTypesOnly: SLAUGHTER },
  { path: '/admin/slaughter/products/calculator', labelKey: 'nav.slaughterCalculator', icon: Calculator, section: 'slaughter', permission: { resource: 'slaughter_calculator', action: 'read' }, vendorTypesOnly: SLAUGHTER },
  { path: '/admin/slaughter/categories', labelKey: 'nav.slaughterCategories', icon: Folder, section: 'slaughter', permission: { resource: 'slaughter_categories', action: 'read' }, vendorTypesOnly: SLAUGHTER },

  { path: '/admin/venue/bookings', labelKey: 'nav.venueBookings', icon: Calendar, section: 'venue', permission: { resource: 'venue_bookings', action: 'read' }, vendorTypesOnly: VENUE_ONLY },
  { path: '/admin/venue/invoices', labelKey: 'nav.venueInvoices', icon: FileText, section: 'venue', permission: { resource: 'venue_invoices', action: 'read' }, vendorTypesOnly: VENUE_ONLY },

  { path: '/admin/users', labelKey: 'nav.allUsers', icon: Users, section: 'users', requireFullAdmin: true },
  { path: '/admin/users/customers', labelKey: 'nav.customers', icon: Users, section: 'users', requireFullAdmin: true },
  { path: '/admin/vendors', labelKey: 'nav.vendors', icon: Package, section: 'users', requireFullAdmin: true },
  { path: '/admin/reviews', labelKey: 'nav.reviews', icon: Star, section: 'users', permission: { resource: 'reviews', action: 'read' }, hideForVendorTypes: MARKETPLACE_ISOLATED },

  { path: '/admin/payments', labelKey: 'nav.payments', icon: CreditCard, section: 'finance', requireFullAdmin: true },
  { path: '/admin/accounts', labelKey: 'nav.accounts', icon: BookOpen, section: 'finance', requireFullAdmin: true },
  { path: '/admin/reports', labelKey: 'nav.reports', icon: FileText, section: 'finance', requireFullAdmin: true },
  { path: '/admin/vendors-map', labelKey: 'nav.vendorsMap', icon: MapPin, section: 'finance', requireFullAdmin: true },
  { path: '/admin/wallets', labelKey: 'nav.wallets', icon: CreditCard, section: 'finance', requireFullAdmin: true },
  { path: '/admin/withdrawals', labelKey: 'nav.withdrawals', icon: Banknote, section: 'finance', requireFullAdmin: true },
  { path: '/admin/commission', labelKey: 'nav.commission', icon: Percent, section: 'finance', requireFullAdmin: true },

  { path: '/admin/vendor/wallet', labelKey: 'nav.myWallet', icon: CreditCard, section: 'provider', providerPortal: true, permission: { resource: 'admin', action: 'dashboard' } },
  { path: '/admin/vendor/reports', labelKey: 'nav.myReports', icon: FileText, section: 'provider', providerPortal: true, permission: { resource: 'admin', action: 'dashboard' } },
  { path: '/admin/vendor/team', labelKey: 'nav.vendorTeam', icon: UserCog, section: 'provider', providerPortal: true, permission: { resource: 'admin', action: 'dashboard' } },
  { path: '/admin/vendor/settings', labelKey: 'nav.vendorAccount', icon: Settings, section: 'provider', providerPortal: true, permission: { resource: 'admin', action: 'dashboard' } },

  { path: '/admin/content/legal', labelKey: 'nav.legalContent', icon: ScrollText, section: 'content', requireFullAdmin: true },
  { path: '/admin/content/media', labelKey: 'nav.appMedia', icon: Image, section: 'content', requireFullAdmin: true },

  { path: '/admin/notifications', labelKey: 'nav.notifications', icon: Bell, section: 'system', requireFullAdmin: true },
  { path: '/admin/roles', labelKey: 'nav.roles', icon: Shield, section: 'system', requireFullAdmin: true },
  { path: '/admin/permissions', labelKey: 'nav.permissions', icon: Lock, section: 'system', requireFullAdmin: true },
  { path: '/admin/settings', labelKey: 'nav.settings', icon: Settings, section: 'system', requireFullAdmin: true },
]

/**
 * @param {object | null} user
 * @returns {{ path: string, labelKey: string, icon: import('lucide-react').LucideIcon, section: string }[]}
 */
export function filterAdminNav(user) {
  if (!user) return []
  return ADMIN_NAV_ITEMS.filter((item) => {
    if (item.requireFullAdmin && !isFullAdminUser(user)) return false
    if (user.role === 'PROVIDER' && item.hideForVendorTypes?.includes(user.vendorType)) return false
    if (item.providerPortal) {
      if (user.role !== 'PROVIDER' || isFullAdminUser(user)) return false
    }
    if (item.vendorTypesOnly?.length) {
      if (isFullAdminUser(user)) {
        /* full admin sees all */
      } else if (user.role !== 'PROVIDER' || !item.vendorTypesOnly.includes(user.vendorType)) {
        return false
      }
    }
    if (item.permission && !hasPermission(user, item.permission.resource, item.permission.action)) {
      return false
    }
    return true
  }).map(({ path, labelKey, icon, section }) => ({
    path: toPortalPath(path, user),
    labelKey,
    icon,
    section: section || 'core',
  }))
}

/** @deprecated use filterAdminNav(readAdminUser()) */
export const ADMIN_NAV = ADMIN_NAV_ITEMS.map(({ path, labelKey, icon }) => ({ path, labelKey, icon }))
