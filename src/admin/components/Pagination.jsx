import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function Pagination({ currentPage, totalPages, onPageChange, total, limit }) {
  const { i18n } = useTranslation()
  const rtl = i18n.language === 'ar'

  if (totalPages <= 1) return null

  const maxVisible = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  const pages = []
  for (let i = startPage; i <= endPage; i++) pages.push(i)

  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, total)

  const Prev = rtl ? ChevronRight : ChevronLeft
  const Next = rtl ? ChevronLeft : ChevronRight

  return (
    <div className="admin-pagination flex flex-col gap-3 border-t border-[var(--admin-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--admin-text-muted)]">
        {rtl
          ? `عرض ${startItem}–${endItem} من ${total}`
          : `Showing ${startItem}–${endItem} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="ads-btn ads-btn-subtle h-8 w-8 p-0 disabled:opacity-40"
          aria-label="Previous page"
        >
          <Prev size={16} />
        </button>
        {startPage > 1 ? (
          <>
            <button type="button" onClick={() => onPageChange(1)} className="admin-page-btn">
              1
            </button>
            {startPage > 2 ? <span className="px-1 text-[var(--admin-text-muted)]">…</span> : null}
          </>
        ) : null}
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`admin-page-btn ${page === currentPage ? 'admin-page-btn-active' : ''}`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages ? (
          <>
            {endPage < totalPages - 1 ? <span className="px-1 text-[var(--admin-text-muted)]">…</span> : null}
            <button type="button" onClick={() => onPageChange(totalPages)} className="admin-page-btn">
              {totalPages}
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ads-btn ads-btn-subtle h-8 w-8 p-0 disabled:opacity-40"
          aria-label="Next page"
        >
          <Next size={16} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
