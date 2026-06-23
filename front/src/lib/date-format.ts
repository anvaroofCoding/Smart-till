import { format, isValid, parse } from 'date-fns'
import { uz } from 'date-fns/locale'

export const DATE_DISPLAY_FORMAT = 'dd.MM.yyyy'
export const DATE_ISO_FORMAT = 'yyyy-MM-dd'

export function formatDateDisplay(value?: string | Date): string {
  if (!value) return ''

  const date = typeof value === 'string' ? parseIsoDate(value) : value
  if (!date) return ''

  return format(date, DATE_DISPLAY_FORMAT, { locale: uz })
}

export function parseIsoDate(value?: string): Date | undefined {
  if (!value?.trim()) return undefined

  const isoParsed = parse(value, DATE_ISO_FORMAT, new Date())
  if (isValid(isoParsed)) return isoParsed

  const fallback = new Date(value)
  return isValid(fallback) ? fallback : undefined
}

export function toIsoDateString(date: Date): string {
  return format(date, DATE_ISO_FORMAT)
}
