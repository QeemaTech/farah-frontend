import { useEffect, useRef, useState } from 'react'

/**
 * Measures its box before rendering Recharts children so width/height are never -1.
 */
export default function ChartContainer({ height = 256, className = '', children }) {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const { width, height: h } = el.getBoundingClientRect()
      setSize({
        width: Math.max(0, Math.floor(width)),
        height: Math.max(0, Math.floor(h || height)),
      })
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [height])

  const ready = size.width > 0 && size.height > 0

  return (
    <div
      ref={ref}
      className={`w-full min-w-0 ${className}`}
      style={{ height, minHeight: height }}
    >
      {ready ? children(size.width, size.height) : (
        <div className="h-full w-full animate-pulse rounded-[var(--admin-radius-control)] bg-[var(--admin-border)]/40" />
      )}
    </div>
  )
}
