import { Outlet } from 'react-router-dom'
import AdminRoute from './AdminRoute'
import AdminLayout from './AdminLayout'
import { AdminPageProvider } from '../contexts/AdminPageContext'

/**
 * Persistent admin chrome — sidebar + header stay mounted while only page content swaps (Outlet).
 */
export default function AdminShell() {
  return (
    <AdminRoute>
      <AdminPageProvider>
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </AdminPageProvider>
    </AdminRoute>
  )
}
