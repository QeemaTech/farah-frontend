/** Modern pill badge */
const variants = {
  default: 'ui-badge ui-badge--default',
  success: 'ui-badge ui-badge--success',
  warning: 'ui-badge ui-badge--warning',
  danger: 'ui-badge ui-badge--danger',
  info: 'ui-badge ui-badge--info',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return <span className={`${variants[variant] || variants.default} ${className}`.trim()}>{children}</span>
}
