import Card from '../../components/ui/Card'

/** ADS panel — full-width card section for filters, tables, forms */
export default function AdminPanel({ title, action, children, className = '', noPadding = false }) {
  return (
    <Card
      title={title}
      action={action}
      className={`w-full max-w-none ${noPadding ? '!p-0' : ''} ${className}`}
    >
      {children}
    </Card>
  )
}
