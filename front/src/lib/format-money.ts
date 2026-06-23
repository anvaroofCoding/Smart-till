export function formatMoney(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0
  const [integerPart, decimalPart = '00'] = safeValue.toFixed(2).split('.')
  const formattedInteger = formatIntegerWithSpaces(integerPart)
  return `${formattedInteger}.${decimalPart}`
}

export function formatMoneyInput(value: string): string {
  const raw = value.replace(/\s/g, '').replace(',', '.')
  if (!raw) return ''

  const sanitized = raw.replace(/[^\d.]/g, '')
  const dotIndex = sanitized.indexOf('.')
  const hasDecimal = dotIndex >= 0

  const integerRaw =
    hasDecimal ? sanitized.slice(0, dotIndex) : sanitized.replace(/\./g, '')
  const decimalRaw = hasDecimal
    ? sanitized.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2)
    : ''

  if (!integerRaw && !decimalRaw && !hasDecimal) return ''

  const normalizedInteger = integerRaw.replace(/^0+(?=\d)/, '')
  const formattedInteger = normalizedInteger
    ? formatIntegerWithSpaces(normalizedInteger)
    : hasDecimal || decimalRaw
      ? '0'
      : ''

  if (!formattedInteger && !decimalRaw && !hasDecimal) return ''

  if (hasDecimal) {
    return decimalRaw.length > 0
      ? `${formattedInteger}.${decimalRaw}`
      : `${formattedInteger}.`
  }

  return formattedInteger
}

export function parseMoneyInput(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  if (!normalized || normalized === '.') return 0

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0
}

function formatIntegerWithSpaces(integerPart: string): string {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
