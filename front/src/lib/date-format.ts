import { format, isValid, parse } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { uz } from 'date-fns/locale/uz'

export const DATE_DISPLAY_FORMAT = 'dd.MM.yyyy'
export const DATE_ISO_FORMAT = 'yyyy-MM-dd'
export const DATE_TIME_DISPLAY_FORMAT = 'MMM dd, yyyy h:mm:ss a'

export function formatDateDisplay(value?: string | Date): string {
  if (!value) return ''

  const date = typeof value === 'string' ? parseIsoDate(value) : value
  if (!date) return ''

  return format(date, DATE_DISPLAY_FORMAT, { locale: uz })
}

export function formatDateTimeDisplay(value?: string | Date): string {
  if (!value) return '—'

  const date = typeof value === 'string' ? parseIsoDate(value) : value
  if (!date) return '—'

  return format(date, DATE_TIME_DISPLAY_FORMAT, { locale: enUS })
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
