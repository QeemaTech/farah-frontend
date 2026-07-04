import { Navigate } from 'react-router-dom'

/** @deprecated — use /admin/content/legal?tab=terms */
export default function Terms() {
  return <Navigate to="/admin/content/legal?tab=terms" replace />
}
