import { Link } from 'react-router-dom'

export default function PageHeader({ title, subtitle, breadcrumbs = [], action }) {
  return (
    <div className="ui-page-header flex flex-wrap items-end justify-between gap-4" style={{ marginBottom: 'var(--space-300)' }}>
      <div>
        {breadcrumbs.length > 0 && (
          <nav
            className="mb-2 flex flex-wrap items-center gap-1.5 text-sm"
            style={{ color: 'var(--admin-text-muted)' }}
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((b, i) => {
              const label = typeof b === 'string' ? b : b.label
              const path = typeof b === 'object' ? b.path : null
              return (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {i > 0 ? <span className="opacity-40">/</span> : null}
                  {path ? (
                    <Link
                      to={path}
                      className="font-medium transition-colors hover:text-[var(--admin-accent)]"
                      style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}
                    >
                      {label}
                    </Link>
                  ) : (
                    <span
                      className="font-medium"
                      style={i === breadcrumbs.length - 1 ? { color: 'var(--admin-text)' } : undefined}
                    >
                      {label}
                    </span>
                  )}
                </span>
              )
            })}
          </nav>
        )}
        <h1 className="m-0 text-[var(--admin-text)]">{title}</h1>
        {subtitle ? <p className="ui-page-subtitle m-0">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  )
}
