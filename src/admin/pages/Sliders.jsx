import { Navigate } from 'react-router-dom'

/** @deprecated — use /admin/content/media?tab=sliders */
export default function Sliders() {
  return <Navigate to="/admin/content/media?tab=sliders" replace />
}
