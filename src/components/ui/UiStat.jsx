export function UiStat({ icon: Icon, iconTone = 'indigo', value, label }) {
  return (
    <div className="ui-stat">
      {Icon ? (
        <div className={`ui-stat__icon ui-stat__icon--${iconTone}`}>
          <Icon size={22} aria-hidden />
        </div>
      ) : null}
      <div>
        <div className="ui-stat__value">{value}</div>
        <div className="ui-stat__label">{label}</div>
      </div>
    </div>
  )
}

export function UiStats({ children, className = '' }) {
  return <div className={`ui-stats ${className}`.trim()}>{children}</div>
}
