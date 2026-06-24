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

export function buildUzbekPhone(local: string): string {
  const digits = formatUzbekPhoneLocal(local)
  return digits ? `+998${digits}` : ''
}

export function hasValidUzbekPhone(local: string): boolean {
  return formatUzbekPhoneLocal(local).length === 9
}
