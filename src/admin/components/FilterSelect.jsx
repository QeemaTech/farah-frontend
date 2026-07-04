import React from 'react'

/**
 * Design System: FilterSelect — قائمة الفلتر
 * Dashboard_style_reports.md §11
 */
function FilterSelect({ value, onChange, children, language, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`
        w-full sm:w-auto sm:min-w-[180px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
        rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
        focus:ring-2 focus:ring-orange-500 focus:border-transparent
        ${className}
      `}
    >
      {children}
    </select>
  )
}

export default FilterSelect
