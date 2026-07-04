/**
 * ADS data table — use embedded={true} inside .admin-data-panel (no double border).
 */
export function AdminTableHead({ children }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  )
}

export function AdminTableTh({ children, className = '' }) {
  return <th className={className}>{children}</th>
}

export function AdminTableBody({ children }) {
  return <tbody>{children}</tbody>
}

export default function AdminTable({ children, className = '', embedded = false }) {
  if (embedded) {
    return (
      <div className={`w-full overflow-x-auto ${className}`}>
        <table className="ui-table admin-modern-table w-full min-w-[880px] border-collapse">{children}</table>
      </div>
    )
  }

  return (
    <div className={`admin-table-shell w-full overflow-x-auto ${className}`}>
      <table className="admin-modern-table w-full min-w-[880px] border-collapse">{children}</table>
    </div>
  )
}
