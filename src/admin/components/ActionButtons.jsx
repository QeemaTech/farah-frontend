import React, { useState } from 'react'
import { Eye, Pencil, Trash2, MoreVertical } from 'lucide-react'

function ActionButtons({
  onView,
  onEdit,
  onDelete,
  showView = true,
  showEdit = true,
  showDelete = true,
  size = 'sm',
  forceShowIcons = false,
}) {
  const [open, setOpen] = useState(false)
  const sizeClass = size === 'sm' ? 'p-1.5' : size === 'md' ? 'p-2' : 'p-2.5'
  const iconClass = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-[18px] w-[18px]' : 'h-5 w-5'

  const buttons = []
  if (showView && onView) {
    buttons.push(
      <button
        key="view"
        type="button"
        onClick={onView}
        className="admin-icon-btn admin-icon-btn-primary border-0"
        title="View"
      >
        <Eye className={iconClass} />
      </button>,
    )
  }
  if (showEdit && onEdit) {
    buttons.push(
      <button
        key="edit"
        type="button"
        onClick={onEdit}
        className="rounded-[var(--admin-radius-control)] p-1.5 text-[var(--admin-accent)] transition-colors hover:bg-[#6366f1]/12"
        title="Edit"
      >
        <Pencil className={iconClass} />
      </button>,
    )
  }
  if (showDelete && onDelete) {
    buttons.push(
      <button
        key="delete"
        type="button"
        onClick={onDelete}
        className="admin-icon-btn admin-icon-btn-danger border-0"
        title="Delete"
      >
        <Trash2 className={iconClass} />
      </button>,
    )
  }

  if (buttons.length === 0) return null

  if (forceShowIcons || buttons.length <= 3) {
    return <div className="flex items-center gap-1">{buttons}</div>
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${sizeClass} rounded-[var(--admin-radius-control)] text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-bg)]`}
      >
        <MoreVertical className={iconClass} />
      </button>
      {open && (
        <React.Fragment>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute end-0 z-20 mt-1 w-40 rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-surface)] py-1 shadow-[var(--admin-shadow-dropdown)]">
            {showView && onView && (
              <button
                type="button"
                onClick={() => {
                  onView()
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-[var(--admin-accent)] hover:bg-[var(--admin-bg)]"
              >
                <Eye className="h-4 w-4" /> View
              </button>
            )}
            {showEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit()
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-[var(--admin-accent)] hover:bg-[var(--admin-bg)]"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            )}
            {showDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete()
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-[var(--admin-danger)] hover:bg-[var(--admin-bg)]"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </React.Fragment>
      )}
    </div>
  )
}

export default ActionButtons
