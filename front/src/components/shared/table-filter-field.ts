import { cn } from '@/lib/utils'

/** Jadval filter qatorida Input va Select bir xil o'lchamda bo'lishi uchun */
export const TABLE_FILTER_FIELD_CLASS = cn(
  'h-8 w-full min-w-0 bg-background px-2.5 py-1 text-xs shadow-none',
)

export const TABLE_FILTER_CELL_CLASS = 'p-1.5 align-middle'

/** Ro'yxat sahifalaridagi jadval qismi — Card o'rniga */
export const LIST_PAGE_TABLE_SECTION_CLASS =
  'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden'

/** Chegarasiz jadval — barcha qatorlarda border yo'q */
export const BORDERLESS_TABLE_CLASS = '[&_[data-slot=table-row]]:border-0'

/** Filter qatori */
export const BORDERLESS_FILTER_ROW_CLASS = 'border-0 hover:bg-transparent'
