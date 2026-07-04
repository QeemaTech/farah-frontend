import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown, Trash2, Download } from 'lucide-react'
import SearchInput from './SearchInput'
import EmptyState from './EmptyState'
import { TableRowSkeleton } from './LoadingSkeleton'

export default function DataTable({
  columns,
  data,
  loading = false,
  searchPlaceholder = '',
  enableRowSelection = true,
  pageSizeOptions = [10, 20, 50],
  initialPageSize = 20,
  emptyTitle = '',
  emptyDescription = '',
  onBulkDelete,
  onBulkExport,
  toolbarExtra = null,
  getRowId = (row) => row.id,
}) {
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection,
    getRowId,
    initialState: { pagination: { pageSize: initialPageSize } },
  })

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length

  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex

  const sortIcon = (meta) => {
    if (!meta) return <ChevronsUpDown className="h-4 w-4 opacity-40" />
    if (meta === 'asc') return <ChevronUp className="h-4 w-4" />
    return <ChevronDown className="h-4 w-4" />
  }

  const colCount = useMemo(() => columns.length + (enableRowSelection ? 1 : 0), [columns, enableRowSelection])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="min-w-[200px] max-w-md flex-1">
          <SearchInput placeholder={searchPlaceholder} onDebouncedChange={setGlobalFilter} />
        </div>
        {toolbarExtra}
      </div>

      {selectedCount > 0 && (onBulkDelete || onBulkExport) && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--admin-radius-control)] border border-[var(--admin-accent)]/40 bg-[var(--admin-accent-subtle)] px-4 py-2 text-sm text-[var(--admin-text)]">
          <span className="font-medium">{selectedCount} selected</span>
          {onBulkExport && (
            <button
              type="button"
              onClick={() => onBulkExport(table.getSelectedRowModel().rows.map((r) => r.original))}
              className="admin-btn admin-btn-ghost h-9 px-3 text-sm"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
          {onBulkDelete && (
            <button
              type="button"
              onClick={() => onBulkDelete(table.getSelectedRowModel().rows.map((r) => r.original))}
              className="inline-flex h-9 items-center gap-1 rounded-[var(--admin-radius-control)] bg-red-500 px-3 text-sm font-medium text-white hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-card)]">
        <table className="w-full min-w-[640px] border-collapse text-start text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[var(--admin-border)] bg-[var(--admin-bg)]">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  return (
                    <th key={header.id} className="px-4 py-3 text-xs font-semibold uppercase text-[var(--admin-text-muted)]">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 ${canSort ? 'cursor-pointer select-none' : ''}`}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort ? sortIcon(header.column.getIsSorted()) : null}
                        </button>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={colCount} />)
              : null}
            {!loading && table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : null}
            {!loading &&
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--admin-border)]/80 transition-colors hover:bg-[var(--admin-bg)]/80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-[var(--admin-text)]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && table.getRowModel().rows.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--admin-text-muted)]">
            <span>Rows</span>
            <select
              className="admin-input h-9 w-auto py-0"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="admin-btn admin-btn-ghost h-9 px-3"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                let p = i
                if (pageCount > 5) {
                  p = Math.min(Math.max(0, pageIndex - 2) + i, pageCount - 5 + i)
                  if (pageIndex > pageCount - 3) p = pageCount - 5 + i
                }
                if (p >= pageCount) return null
                const active = p === pageIndex
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => table.setPageIndex(p)}
                    className={`h-9 min-w-[2.25rem] rounded-[var(--admin-radius-control)] text-sm font-medium ${
                      active
                        ? 'bg-[var(--admin-accent)] text-white'
                        : 'border border-[var(--admin-border)] text-[var(--admin-text)] hover:bg-[var(--admin-bg)]'
                    }`}
                  >
                    {p + 1}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-ghost h-9 px-3"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
