/**
 * Format amount with currency from settings.
 * @param {number} amount
 * @param {{ currencySymbol?: string, currencyCode?: string, currencyDecimals?: number, currencyPosition?: string }} settings
 * @returns {string}
 */
export function formatCurrency(amount, settings = {}) {
  const symbol = settings.currencySymbol || settings.currencyCode || 'ر.س'
  const decimals = settings.currencyDecimals != null ? settings.currencyDecimals : 2
  const position = settings.currencyPosition || 'AFTER'
  const value = Number(amount)
  if (isNaN(value)) return `0 ${symbol}`
  const formatted = value.toFixed(decimals)
  return position === 'BEFORE' ? `${symbol} ${formatted}` : `${formatted} ${symbol}`
}
