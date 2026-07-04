import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AdminPage from './AdminPage'
import { AdminContent, UiCard } from '../design-system'

/**
 * Standard shell for add/edit admin forms — full-width header + card body.
 */
export default function AdminFormShell({
  title,
  subtitle,
  breadcrumbs = [],
  backTo,
  backLabel,
  children,
  footer,
  loading = false,
}) {
  const navigate = useNavigate()

  const action = backTo ? (
    <button type="button" onClick={() => navigate(backTo)} className="ads-btn ads-btn-subtle gap-2">
      <ArrowLeft size={18} aria-hidden />
      {backLabel}
    </button>
  ) : null

  return (
    <AdminPage title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} action={action} loading={loading}>
      <AdminContent>
        <UiCard>
          <div className="admin-form-shell space-y-6">{children}</div>
        </UiCard>
        {footer ? <div className="admin-form-shell__footer sticky bottom-0 z-10 flex flex-wrap justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-bg)]/95 py-4 backdrop-blur-sm">{footer}</div> : null}
      </AdminContent>
    </AdminPage>
  )
}

/** Section heading inside AdminFormShell */
export function FormSection({ title, children, className = '' }) {
  return (
    <section className={className}>
      {title ? <h3 className="mb-4 text-base font-semibold text-[var(--admin-text)]">{title}</h3> : null}
      {children}
    </section>
  )
}

/** Label + field grid helper */
export function FormField({ label, required, children, className = '' }) {
  return (
    <div className={className}>
      {label ? (
        <label className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}
      {children}
    </div>
  )
}
