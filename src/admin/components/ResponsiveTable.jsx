import React from 'react'

/** ADS table wrapper — full width, horizontal scroll on small screens */
function ResponsiveTable({ children, className = '' }) {
  return (
    <div className={`admin-table-wrap w-full ${className}`}>
      <table className="w-full min-w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

export default ResponsiveTable
