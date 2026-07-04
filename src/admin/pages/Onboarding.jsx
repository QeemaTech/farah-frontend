import { Navigate } from 'react-router-dom'

/** @deprecated — use /admin/content/media?tab=onboarding */
export default function Onboarding() {
  return <Navigate to="/admin/content/media?tab=onboarding" replace />
}
