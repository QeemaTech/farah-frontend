import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Drawer({ open, onClose, title, children, side = 'end' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const isEnd = side === 'end'

  return (
    <div className="fixed inset-0 z-[200] flex">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close" onClick={onClose} />
      <aside
        className="relative z-10 ml-auto flex h-full w-full max-w-xl flex-col border-s border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-dropdown)]"
        style={{ [isEnd ? 'marginInlineStart' : 'marginInlineEnd']: 'auto' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--admin-radius-control)] p-2 text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  )
}
