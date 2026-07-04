/** Modern panel — toolbar + content (matches Users page). */
export default function UiCard({ children, className = '', toolbar, ariaLabel }) {
  return (
    <section className={`ui-card ${className}`.trim()} aria-label={ariaLabel}>
      {toolbar ? <div className="ui-card__toolbar">{toolbar}</div> : null}
      {children}
    </section>
  )
}
