export default function Card({ title, action, children, className = '', noPadding = false }) {
  return (
    <section className={`ui-card ${className}`.trim()} style={noPadding ? { padding: 0 } : undefined}>
      {(title || action) && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${noPadding ? 'px-5 py-4' : 'mb-4 pb-4'}`}
          style={{ borderBottom: noPadding ? '1px solid var(--admin-border)' : '1px solid var(--admin-border)' }}
        >
          {title ? <h2 className="m-0 text-base font-semibold text-[var(--admin-text)]">{title}</h2> : <span />}
          {action}
        </div>
      )}
      <div className={noPadding ? '' : ''}>{children}</div>
    </section>
  )
}
