import useAdminPageMeta from '../hooks/useAdminPageMeta'

/**
 * Registers page title/actions with the persistent AdminShell layout; renders page content only.
 */
export default function AdminPage({ children, loading, pageLoading, ...props }) {
  useAdminPageMeta({ ...props, loading, pageLoading: pageLoading ?? loading })
  return children ?? null
}
