import AdminPage from './AdminPage'
import { AdminContent, UiCard, UiTableSkeleton } from '../design-system'
import EmptyState from '../../components/ui/EmptyState'

/**
 * Standard modern list page shell — stats row + UiCard + table content.
 */
export default function ModernListPage({
  title,
  subtitle,
  breadcrumbs,
  action,
  stats,
  toolbar,
  loading,
  empty,
  emptyTitle,
  emptyDescription,
  children,
  ariaLabel,
}) {
  return (
    <AdminPage title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} action={action}>
      <AdminContent>
        {stats}
        <UiCard toolbar={toolbar} ariaLabel={ariaLabel || title}>
          {loading ? (
            <UiTableSkeleton />
          ) : empty ? (
            <EmptyState title={emptyTitle} description={emptyDescription} />
          ) : (
            children
          )}
        </UiCard>
      </AdminContent>
    </AdminPage>
  )
}
