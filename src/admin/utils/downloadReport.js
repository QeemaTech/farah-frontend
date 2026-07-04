import axios from 'axios'
import { API_URL } from './adminSession'

/**
 * Download a completed admin report file (CSV/PDF).
 * Validates the response is not a JSON error disguised as a blob.
 */
export async function downloadAdminReport(report) {
  const token = localStorage.getItem('admin_token')
  const res = await axios.get(`${API_URL}/reports/${report.id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  })

  const contentType = res.headers['content-type'] || ''
  if (contentType.includes('application/json')) {
    const text = await res.data.text()
    let message = 'Download failed'
    try {
      const json = JSON.parse(text)
      message = json.error || json.message || message
    } catch {
      message = text || message
    }
    throw new Error(message)
  }

  const ext = report.format === 'CSV' ? 'csv' : 'pdf'
  const mime =
    report.format === 'CSV'
      ? 'text/csv;charset=utf-8'
      : contentType.includes('pdf')
        ? 'application/pdf'
        : 'application/octet-stream'

  const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.resource}_${report.id.slice(0, 8)}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
