import { Inbox } from 'lucide-react'

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--admin-border)]/50 text-[var(--admin-text-muted)]">
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-[var(--admin-text)]">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-[var(--admin-text-muted)]">{description}</p> : null}
      {action}
    </div>
  )
}
