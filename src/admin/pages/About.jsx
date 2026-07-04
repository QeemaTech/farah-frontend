import { Navigate } from 'react-router-dom'

/** @deprecated — use /admin/content/legal?tab=about */
export default function About() {
  return <Navigate to="/admin/content/legal?tab=about" replace />
}
