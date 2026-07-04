import React from 'react'

const typeStyles = {
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  info: 'bg-orange-600 hover:bg-orange-700 text-white',
}

/**
 * Design System: ConfirmDialog — حوار التأكيد (danger | warning | info)
 * Dashboard_style_reports.md §13
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmLabel,
  cancelLabel,
}) {
  if (!isOpen) return null

  const buttonClass = typeStyles[type] || typeStyles.danger

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900/80"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-[10000] bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h3 id="confirm-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors ${buttonClass}`}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
