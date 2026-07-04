/**

 * Admin dashboard session (ADMIN or PROVIDER from /api/auth/admin/login).

 * Venue providers call unified vendor APIs under /api/mobile/vendor/*.

 */



export function readAdminUser() {

  try {

    const raw = localStorage.getItem('admin_user')

    return raw ? JSON.parse(raw) : null

  } catch {

    return null

  }

}



export function getAdminToken() {

  return localStorage.getItem('admin_token')

}



export function adminAuthHeaders() {

  const token = getAdminToken()

  return token ? { Authorization: `Bearer ${token}` } : {}

}



export function isFullAdminUser(user = readAdminUser()) {

  return user?.role === 'ADMIN' || user?.isFullAdmin === true

}



export function usesProviderApis(user = readAdminUser()) {

  return user?.role === 'PROVIDER' && !isFullAdminUser(user)

}



/** Normalize API boolean fields (true, "true", false, "false", 0, 1). */

export function parseAdminBoolean(value) {

  if (value === true || value === 'true' || value === 1 || value === '1') return true

  if (value === false || value === 'false' || value === 0 || value === '0') return false

  return Boolean(value)

}



const SLAUGHTER_VENDOR_TYPES = ['SLAUGHTER_PROVIDER']



export function isSlaughterOnlyVendor(user = readAdminUser()) {

  return user?.role === 'PROVIDER' && SLAUGHTER_VENDOR_TYPES.includes(user?.vendorType)

}



export function hasPermission(user, resource, action) {

  if (!user) return false

  if (isFullAdminUser(user)) return true

  const list = user.permissions

  if (!Array.isArray(list)) return false

  return list.some((p) => p.resource === resource && p.action === action)

}



export const API_URL = import.meta.env.VITE_API_URL || '/api'



/** Base URL without trailing /api — for paths like /api/mobile/... */

export function apiOrigin() {

  const stripped = API_URL.replace(/\/api\/?$/, '')

  if (!stripped || stripped.startsWith('/')) {

    return typeof window !== 'undefined' ? window.location.origin : ''

  }

  return stripped

}



const VENUE_VENDOR_TYPES = ['VENUE_PROVIDER']



export function isVenueOnlyVendor(user = readAdminUser()) {

  return user?.role === 'PROVIDER' && VENUE_VENDOR_TYPES.includes(user?.vendorType)

}



/** Unified vendor API base for marketplace / venue providers. */

export function getMobileVendorApiBase() {

  return `${API_URL}/mobile/vendor`

}



/** Venue CRUD/list URLs — provider manages; full admin is read-only in the UI. */

export function getVenueApiConfig(user = readAdminUser()) {

  const headers = adminAuthHeaders()

  const providerMode = usesProviderApis(user)

  const base = providerMode ? `${getMobileVendorApiBase()}/venues` : `${API_URL}/admin/venues`

  return {

    headers,

    readOnly: !providerMode,

    listUrl: base,

    detailUrl: (id) => `${base}/${id}`,

    createUrl: base,

    updateUrl: (id) => `${base}/${id}`,

    statusUrl: (id) => `${base}/${id}/status`,

    workingHoursUrl: (id) => `${base}/${id}/working-hours`,

    pricingUrl: (id) => `${base}/${id}/pricing`,

    calendarUrl: (id) => `${base}/${id}/bookings-calendar`,

    holidaysUrl: (id) => `${base}/${id}/holidays`,

    deleteHolidayUrl: (id, holidayId) => `${base}/${id}/holidays/${holidayId}`,

    deleteUrl: (id) => `${base}/${id}`,

  }

}



/**

 * Marketplace services/reviews/earnings for venue providers under /api/mobile/vendor/*.

 */

export function getMarketplaceVendorApiConfig(user = readAdminUser()) {

  const headers = adminAuthHeaders()

  const base = getMobileVendorApiBase()

  return {

    headers,

    isProvider: usesProviderApis(user),

    dashboardUrl: `${base}/dashboard`,

    servicesUrl: `${base}/services`,

    serviceUrl: (id) => `${base}/services/${id}`,

    bookingsUrl: `${base}/bookings`,

    bookingUrl: (id) => `${base}/bookings/${id}`,

    bookingStatusUrl: (id) => `${base}/bookings/${id}/status`,

    reviewsUrl: `${base}/reviews`,

    reviewUrl: (id) => `${base}/reviews/${id}`,

    earningsUrl: `${base}/earnings`,

    invoicesUrl: `${base}/invoices`,

  }

}



/**

 * Venue bookings list/detail/status — admin uses /api/admin/*; venue owner uses /api/mobile/vendor/*.

 */

export function getVenueBookingsApiConfig(user = readAdminUser()) {

  const headers = adminAuthHeaders()

  const venueOnly = { venueOnly: 'true' }

  const vendorBase = getMobileVendorApiBase()



  if (isFullAdminUser(user)) {

    return {

      kind: 'admin',

      headers,

      listUrl: `${API_URL}/admin/bookings`,

      listParams: venueOnly,

      detailUrl: (id) => `${API_URL}/admin/bookings/${id}`,

      statusUrl: (id) => `${API_URL}/admin/bookings/${id}/status`,

      invoiceUrl: null,

    }

  }



  if (user?.role === 'PROVIDER' && user?.vendorType === 'VENUE_PROVIDER') {

    return {

      kind: 'vendor',

      headers,

      listUrl: `${vendorBase}/bookings`,

      listParams: venueOnly,

      detailUrl: (id) => `${vendorBase}/bookings/${id}`,

      statusUrl: (id) => `${vendorBase}/bookings/${id}/status`,

      invoiceUrl: `${vendorBase}/invoices`,

      invoiceHeaders: headers,

    }

  }



  return {

    kind: 'mobile',

    headers,

    listUrl: `${vendorBase}/bookings`,

    listParams: {},

    detailUrl: (id) => `${vendorBase}/bookings/${id}`,

    statusUrl: (id) => `${vendorBase}/bookings/${id}/status`,

    invoiceUrl: `${vendorBase}/invoices`,

  }

}



/**

 * Slaughter endpoints: admin uses /api/admin/slaughter/*; approved slaughter vendor uses /api/mobile/vendor/slaughter/* (and public /api/mobile/slaughter for categories + calculate).

 */

export function getSlaughterApiMode() {
  const user = readAdminUser()
  const vendorSlaughter = user?.role === 'PROVIDER' && user?.vendorType === 'SLAUGHTER_PROVIDER'
  const origin = apiOrigin()
  const headers = adminAuthHeaders()

  if (isFullAdminUser(user)) {
    return {
      origin,
      headers,
      categoriesUrl: `${origin}/api/admin/slaughter/categories`,
      productsUrl: `${origin}/api/admin/slaughter/products`,
      calculateUrl: `${origin}/api/admin/slaughter/calculate`,
      calculateAuth: { headers },
      useVendorProductApi: false,
      useVendorCategoryApi: false,
      usePublicCategoriesAndCalculate: false,
    }
  }

  if (vendorSlaughter) {
    return {
      origin,
      headers,
      categoriesUrl: `${origin}/api/mobile/slaughter/categories`,
      productsUrl: `${origin}/api/mobile/vendor/slaughter/products`,
      calculateUrl: `${origin}/api/mobile/vendor/slaughter/calculate`,
      calculateAuth: { headers },
      useVendorProductApi: true,
      useVendorCategoryApi: true,
      usePublicCategoriesAndCalculate: false,
    }
  }

  return {
    origin,
    headers,
    categoriesUrl: `${origin}/api/mobile/slaughter/categories`,
    productsUrl: `${origin}/api/mobile/slaughter/products`,
    calculateUrl: `${origin}/api/mobile/slaughter/calculate`,
    calculateAuth: {},
    useVendorProductApi: false,
    useVendorCategoryApi: false,
    usePublicCategoriesAndCalculate: true,
  }
}

/** @deprecated Use getMarketplaceVendorApiConfig() */
export function getVenueVendorApiMode() {
  const cfg = getMarketplaceVendorApiConfig()
  return {
    origin: apiOrigin(),
    headers: cfg.headers,
    useVendorVenueApi: isVenueOnlyVendor(),
    invoicesUrl: cfg.invoicesUrl,
  }
}

