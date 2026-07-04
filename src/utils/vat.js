/**
 * VAT display helpers (mirrors Farah-api/src/utils/vat.js).
 */

export function computeVatBreakdown(subtotalExVat, vatRate = 14.5, decimals = 2) {
  const rate = Number(vatRate)
  const factor = 10 ** decimals
  const subtotal = Math.round((Number(subtotalExVat) + Number.EPSILON) * factor) / factor
  const vatAmount = Math.round((subtotal * (rate / 100) + Number.EPSILON) * factor) / factor
  const totalInclVat = Math.round((subtotal + vatAmount + Number.EPSILON) * factor) / factor
  return { subtotalExVat: subtotal, vatRate: rate, vatAmount, totalInclVat }
}

export function resolveVatFromRecord(record, fallbackSubtotal) {
  if (record?.subtotalExVat != null && record?.vatAmount != null && record?.totalInclVat != null) {
    return {
      subtotalExVat: Number(record.subtotalExVat),
      vatRate: Number(record.vatRate ?? 14.5),
      vatAmount: Number(record.vatAmount),
      totalInclVat: Number(record.totalInclVat),
    }
  }
  const subtotal = record?.finalAmount ?? record?.totalAmount ?? fallbackSubtotal ?? 0
  if (record?.vatRate != null && record?.vatAmount != null && record?.totalInclVat != null) {
    return {
      subtotalExVat: subtotal,
      vatRate: Number(record.vatRate),
      vatAmount: Number(record.vatAmount),
      totalInclVat: Number(record.totalInclVat),
    }
  }
  return computeVatBreakdown(subtotal, record?.vatRate ?? 14.5)
}
