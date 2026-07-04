import axios from 'axios'
import { API_URL, adminAuthHeaders } from './adminSession'

/** Fresh auth headers on every call (avoids stale useMemo after login). */
export function withAdminAuth(config = {}) {
  return {
    ...config,
    headers: { ...config.headers, ...adminAuthHeaders() },
  }
}

export function getSettings(timeout = 8000) {
  return axios.get(`${API_URL}/settings`, { timeout })
}

/** Provider-only mobile vendor API paths (Bearer = admin dashboard token). */
export function vendorGet(path, config = {}) {
  return axios.get(`${API_URL}/mobile/vendor${path}`, withAdminAuth(config))
}

export function vendorPost(path, data, config = {}) {
  return axios.post(`${API_URL}/mobile/vendor${path}`, data, withAdminAuth(config))
}

export function vendorPatch(path, data, config = {}) {
  return axios.patch(`${API_URL}/mobile/vendor${path}`, data, withAdminAuth(config))
}

export function vendorDelete(path, config = {}) {
  return axios.delete(`${API_URL}/mobile/vendor${path}`, withAdminAuth(config))
}
