export function UiTableWrap({ children, className = '' }) {
  return <div className={`ui-table-wrap ${className}`.trim()}>{children}</div>
}

export default function UiTable({ children, className = '', tableClassName = '', minWidth }) {
  const tableStyle =
    minWidth != null
      ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }
      : undefined

  return (
    <UiTableWrap className={className}>
      <table className={`ui-table ${tableClassName}`.trim()} style={tableStyle}>
        {children}
      </table>
    </UiTableWrap>
  )
}

export function UiTableSkeleton({ rows = 6, cols = 7 }) {
  return (
    <UiTable>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="ui-skeleton-row">
            <td colSpan={cols}>
              <div className="ui-skeleton-bar" style={{ width: `${55 + (i % 4) * 8}%` }} />
            </td>
          </tr>
        ))}
      </tbody>
    </UiTable>
  )
}
