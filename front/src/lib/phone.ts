export function formatUzbekPhoneLocal(value: string): string {
  return value.replace(/\D/g, '').slice(0, 9)
}

export function parseUzbekPhoneLocal(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('998')) {
    return digits.slice(3, 12)
  }
  return formatUzbekPhoneLocal(digits)
}

/** 90 001 01 01 */
export function formatUzbekPhoneLocalDisplay(local: string): string {
  const digits = formatUzbekPhoneLocal(local)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)} ${digits.slice(2)}`
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
  }

  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
}

/** +998 90 001 01 01 */
export function formatUzbekPhoneMasked(local: string): string {
  const display = formatUzbekPhoneLocalDisplay(local)
  return display ? `+998 ${display}` : '+998 '
}

export function buildUzbekPhone(local: string): string {
  const digits = formatUzbekPhoneLocal(local)
  return digits ? `+998${digits}` : ''
}

export function hasValidUzbekPhone(local: string): boolean {
  return formatUzbekPhoneLocal(local).length === 9
}
