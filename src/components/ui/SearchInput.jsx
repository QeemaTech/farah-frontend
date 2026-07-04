import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchInput({
  value: controlledValue,
  onChange,
  onDebouncedChange,
  debounceMs = 300,
  placeholder = '',
  className = '',
  inputClassName = '',
  iconAtEnd = false,
}) {
  const [inner, setInner] = useState(controlledValue ?? '')

  useEffect(() => {
    if (controlledValue !== undefined) setInner(controlledValue)
  }, [controlledValue])

  useEffect(() => {
    if (!onDebouncedChange) return undefined
    const id = setTimeout(() => onDebouncedChange(inner), debounceMs)
    return () => clearTimeout(id)
  }, [inner, debounceMs, onDebouncedChange])

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-muted)] ${
          iconAtEnd ? 'end-3' : 'start-3'
        }`}
      />
      <input
        type="search"
        value={inner}
        onChange={(e) => {
          const v = e.target.value
          setInner(v)
          onChange?.(v)
        }}
        placeholder={placeholder}
        className={`admin-input ${iconAtEnd ? 'pe-10' : 'ps-10'} ${inputClassName}`.trim()}
      />
    </div>
  )
}
