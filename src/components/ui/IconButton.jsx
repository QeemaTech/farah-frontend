/**
 * Consistent icon-only control for admin tables and toolbars.
 * Relies on `.admin-icon-btn` (+ variants) in `styles/globals.css`.
 */
export default function IconButton({
  children,
  variant = 'default',
  className = '',
  title,
  type = 'button',
  ...rest
}) {
  const v =
    variant === 'primary'
      ? 'admin-icon-btn-primary'
      : variant === 'danger'
        ? 'admin-icon-btn-danger'
        : ''
  return (
    <button
      type={type}
      title={title}
      className={`admin-icon-btn ${v} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
