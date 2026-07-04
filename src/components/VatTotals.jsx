import { formatCurrency } from '../utils/currency'
import { resolveVatFromRecord } from '../utils/vat'

/**
 * Renders subtotal, VAT, and total incl. VAT for invoices and bookings.
 */
export default function VatTotals({
  record,
  subtotal,
  currencySettings = {},
  className = '',
  labels = {},
}) {
  const L = {
    subtotal: labels.subtotal ?? 'المجموع (بدون ضريبة)',
    vat: labels.vat ?? 'ضريبة القيمة المضافة',
    total: labels.total ?? 'الإجمالي شامل الضريبة',
  }

  const source = record ?? { finalAmount: subtotal, totalAmount: subtotal }
  const vat = resolveVatFromRecord(source, subtotal)
  const vatLabel = `${L.vat} (${vat.vatRate}%)`

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-[var(--admin-text-muted,#666)]">{L.subtotal}</span>
        <span className="font-medium tabular-nums">{formatCurrency(vat.subtotalExVat, currencySettings)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-[var(--admin-text-muted,#666)]">{vatLabel}</span>
        <span className="font-medium tabular-nums">{formatCurrency(vat.vatAmount, currencySettings)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-[var(--admin-border,#eee)] pt-2 text-base font-bold">
        <span>{L.total}</span>
        <span className="tabular-nums text-[var(--admin-accent,#2d2871)]">
          {formatCurrency(vat.totalInclVat, currencySettings)}
        </span>
      </div>
    </div>
  )
}
