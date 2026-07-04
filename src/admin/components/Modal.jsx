import React, { useEffect } from 'react'
import { X } from 'lucide-react'

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw] max-h-[95vh]',
}

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-modal-overlay absolute inset-0 transition-opacity"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div
        className={`admin-modal-panel relative z-[10000] flex max-h-[calc(100vh-120px)] w-full flex-col rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--elevation-modal)] ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-bg)] px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-[var(--admin-text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-icon-btn text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal
