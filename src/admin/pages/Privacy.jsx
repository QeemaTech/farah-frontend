import { Navigate } from 'react-router-dom'

/** @deprecated — use /admin/content/legal?tab=privacy */
export default function Privacy() {
  return <Navigate to="/admin/content/legal?tab=privacy" replace />
}
