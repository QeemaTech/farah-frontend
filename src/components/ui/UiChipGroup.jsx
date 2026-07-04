export function UiChip({ active, onClick, children }) {
  return (
    <button type="button" className={`ui-chip ${active ? 'ui-chip--active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

export default function UiChipGroup({ children, className = '', ariaLabel }) {
  return (
    <div className={`ui-chips ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {children}
    </div>
  )
}
