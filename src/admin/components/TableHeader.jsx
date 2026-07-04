import React from 'react'

function TableHeader({ children, className = '' }) {
  return <th className={className}>{children}</th>
}

export default TableHeader
