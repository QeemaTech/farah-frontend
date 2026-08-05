import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { readAdminUser, getAdminToken, usesProviderApis, isFullAdminUser, getPortalLoginPath } from '../utils/adminSession'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

/** Avoid re-blocking navigation on every route change (AdminShell mounts once). */
const adminSessionBootstrap = { done: false, inFlight: false }
let bootstrapPromise = null

function runAdminSessionBootstrap(token) {
  if (adminSessionBootstrap.done) return Promise.resolve()
  if (bootstrapPromise) return bootstrapPromise

  const existing = readAdminUser()
  // Vendor mobile tokens are not valid on /auth/admin/me
  if (existing?.authSource === 'vendor') {
    adminSessionBootstrap.done = true
    return Promise.resolve()
  }

  adminSessionBootstrap.inFlight = true
  bootstrapPromise = axios
    .get(`${API_URL}/auth/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 12000,
    })
    .then((res) => {
      if (res.data?.success && res.data.user) {
        const merged = {
          ...res.data.user,
          vendorType: res.data.vendorType ?? null,
          vendorStatus: res.data.vendorStatus ?? null,
          permissions: res.data.permissions ?? null,
          isFullAdmin: !!res.data.isFullAdmin,
          authSource: 'admin',
        }
        localStorage.setItem('admin_user', JSON.stringify(merged))
      }
    })
    .catch((e) => {
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        throw e
      }
    })
    .finally(() => {
      adminSessionBootstrap.inFlight = false
      adminSessionBootstrap.done = true
      bootstrapPromise = null
    })

  return bootstrapPromise
}

export function resetAdminSessionBootstrap() {
  adminSessionBootstrap.done = false
  adminSessionBootstrap.inFlight = false
  bootstrapPromise = null
}

function AdminRoute({ children }) {
  const location = useLocation()
  const adminToken = getAdminToken()
  const [bootstrapped, setBootstrapped] = useState(
    () => !adminToken || adminSessionBootstrap.done
  )
  const [authLost, setAuthLost] = useState(false)

  useEffect(() => {
    if (!adminToken) {
      setBootstrapped(true)
      return
    }
    if (adminSessionBootstrap.done) {
      setBootstrapped(true)
      return
    }

    let cancelled = false
    runAdminSessionBootstrap(adminToken)
      .catch((e) => {
        if (cancelled) return
        if (e.response?.status === 401 || e.response?.status === 403) {
          setAuthLost(true)
        }
      })
      .finally(() => {
        if (!cancelled) setBootstrapped(true)
      })

    return () => {
      cancelled = true
    }
  }, [adminToken])

  if (authLost) {
    return <Navigate to={getPortalLoginPath(location.pathname)} state={{ from: location }} replace />
  }

  if (!adminToken) {
    return <Navigate to={getPortalLoginPath(location.pathname)} state={{ from: location }} replace />
  }

  const adminUser = readAdminUser()
  if (!adminUser) {
    return bootstrapped ? (
      <Navigate to={getPortalLoginPath(location.pathname)} state={{ from: location }} replace />
    ) : (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      </div>
    )
  }

  if (adminUser.role !== 'ADMIN' && adminUser.role !== 'PROVIDER') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">ليس لديك صلاحية للوصول إلى لوحة التحكم</p>
          <Navigate to={getPortalLoginPath(location.pathname)} replace />
        </div>
      </div>
    )
  }

  // Keep vendors on /provider/* and full admins on /admin/*
  if (
    usesProviderApis(adminUser) &&
    location.pathname.startsWith('/admin') &&
    location.pathname !== '/admin/login'
  ) {
    const next = `${location.pathname.replace(/^\/admin/, '/provider')}${location.search}${location.hash}`
    return <Navigate to={next} replace />
  }

  if (isFullAdminUser(adminUser) && location.pathname.startsWith('/provider')) {
    const next = `${location.pathname.replace(/^\/provider/, '/admin')}${location.search}${location.hash}`
    return <Navigate to={next} replace />
  }

  return children
}

export default AdminRoute
