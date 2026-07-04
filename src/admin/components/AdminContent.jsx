/**
 * Full-width content stack for admin pages (ADS).
 */
export default function AdminContent({ children, className = '' }) {
  return (
    <div className={`admin-content flex w-full max-w-none flex-col gap-6 ${className}`}>{children}</div>
  )
}
