/** Modern horizontal tabs */
export default function UiTabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`ui-tabs ${className}`.trim()} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`ui-tab ${active === tab.id ? 'ui-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon ? <tab.icon size={16} aria-hidden className="shrink-0" /> : null}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
