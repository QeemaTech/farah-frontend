import React from 'react'
import { Trash2, CircleCheck, CircleX, Download, Upload } from 'lucide-react'

function BulkActions({
  selectedItems = [],
  onBulkDelete,
  onBulkStatusUpdate,
  onSelectionChange,
  onExport,
  onImport,
  showDelete = true,
  showStatusUpdate = true,
  showExport = false,
  showImport = false,
  exportEndpoint,
  clearLabel = 'Clear selection',
}) {
  if (!selectedItems || selectedItems.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--admin-radius-card)] border border-[#6366f1]/30 bg-[#6366f1]/8 p-4">
      <span className="text-sm font-medium text-[var(--admin-text)]">
        {selectedItems.length} selected
      </span>
      {showDelete && onBulkDelete && (
        <button
          type="button"
          onClick={() => onBulkDelete(selectedItems)}
          className="admin-toolbar-btn-accent inline-flex items-center gap-2 bg-[var(--admin-danger)] hover:filter-none"
          style={{ background: 'var(--admin-danger)' }}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      )}
      {showStatusUpdate && onBulkStatusUpdate && (
        <>
          <button
            type="button"
            onClick={() => onBulkStatusUpdate(selectedItems, 'active')}
            className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] bg-[var(--admin-success)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            <CircleCheck className="h-4 w-4" /> Activate
          </button>
          <button
            type="button"
            onClick={() => onBulkStatusUpdate(selectedItems, 'inactive')}
            className="admin-toolbar-btn inline-flex items-center gap-2"
          >
            <CircleX className="h-4 w-4" /> Deactivate
          </button>
        </>
      )}
      {showExport && (onExport || exportEndpoint) && (
        <button
          type="button"
          onClick={() => (onExport ? onExport(selectedItems) : window.open(exportEndpoint, '_blank'))}
          className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          <Download className="h-4 w-4" /> Export
        </button>
      )}
      {showImport && onImport && (
        <button
          type="button"
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          <Upload className="h-4 w-4" /> Import
        </button>
      )}
      <button
        type="button"
        onClick={() => onSelectionChange && onSelectionChange([])}
        className="text-sm font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
      >
        {clearLabel}
      </button>
    </div>
  )
}

export default BulkActions
