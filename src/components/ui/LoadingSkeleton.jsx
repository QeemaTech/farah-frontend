export function TableRowSkeleton({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="admin-skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-card)]">
      <div className="admin-skeleton mb-4 h-6 w-1/3" />
      <div className="admin-skeleton h-32 w-full" />
    </div>
  )
}

export default function LoadingSkeleton({ variant = 'card' }) {
  if (variant === 'card') return <CardSkeleton />
  return null
}
