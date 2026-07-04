import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AdminPage from './AdminPage'
import { AdminContent, UiCard, UiTableSkeleton } from '../design-system'
import EmptyState from '../../components/ui/EmptyState'

/**
 * Detail / nested page shell — breadcrumbs, back, optional actions, card body.
 */
export default function AdminDetailShell({
  title,
  subtitle,
  breadcrumbs = [],
  backTo,
  backLabel,
  action,
  loading,
  empty,
  emptyTitle,
  emptyDescription,
  children,
  noCard = false,
}) {
  const navigate = useNavigate()

  const headerAction = (
    <>
      {backTo ? (
        <button type="button" onClick={() => navigate(backTo)} className="ads-btn ads-btn-subtle gap-2">
          <ArrowLeft size={18} aria-hidden />
          {backLabel}
        </button>
      ) : null}
      {action}
    </>
  )

  return (
    <AdminPage title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} action={headerAction} pageLoading={false}>
      <AdminContent>
        {loading ? (
          <UiCard>
            <UiTableSkeleton rows={4} cols={2} />
          </UiCard>
        ) : empty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : noCard ? (
          children
        ) : (
          <UiCard>{children}</UiCard>
        )}
      </AdminContent>
    </AdminPage>
  )
}
