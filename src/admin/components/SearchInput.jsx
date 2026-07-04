import React from 'react'
import { Search } from 'lucide-react'

function SearchInput({ value, onChange, placeholder = 'Search...', language = 'ar', className = '' }) {
  const isRtl = language === 'ar'
  return (
    <div className="relative min-w-0 flex-1">
      <div
        className={`pointer-events-none absolute inset-y-0 flex items-center ${isRtl ? 'right-0 pr-3 sm:pr-4' : 'left-0 pl-3 sm:pl-4'}`}
      >
        <Search className="h-4 w-4 text-[var(--admin-text-muted)] sm:h-5 sm:w-5" />
      </div>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          admin-input w-full py-2 text-sm sm:text-base
          ${isRtl ? 'pl-3 sm:pl-4 pr-8 sm:pr-10' : 'pr-3 sm:pr-4 pl-8 sm:pl-10'}
          ${className}
        `}
      />
    </div>
  )
}

export default SearchInput
