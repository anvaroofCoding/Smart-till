import {
  BORDERLESS_FILTER_ROW_CLASS,
  TABLE_FILTER_CELL_CLASS,
  TABLE_FILTER_FIELD_CLASS,
} from '@/components/shared/table-filter-field'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import type { OrderFulfillmentTableFilters } from './order-fulfillment-table-filters'

interface OrderFulfillmentTableFiltersRowProps {
  filters: OrderFulfillmentTableFilters
  disabled?: boolean
  onChange: (patch: Partial<OrderFulfillmentTableFilters>) => void
}

export function OrderFulfillmentTableFiltersRow({
  filters,
  disabled,
  onChange,
}: OrderFulfillmentTableFiltersRowProps) {
  return (
    <TableRow className={BORDERLESS_FILTER_ROW_CLASS}>
      <TableCell className={TABLE_FILTER_CELL_CLASS} />

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.id}
          onChange={(e) => onChange({ id: e.target.value })}
          placeholder="ID"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="ID bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.customerName}
          onChange={(e) => onChange({ customerName: e.target.value })}
          placeholder="Mijoz"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Mijoz bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.customerPhone}
          onChange={(e) => onChange({ customerPhone: e.target.value })}
          placeholder="Telefon"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Telefon bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.total}
          onChange={(e) => onChange({ total: e.target.value })}
          placeholder="Narx"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Umumiy narx bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS} />

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.createdAt}
          onChange={(e) => onChange({ createdAt: e.target.value })}
          placeholder="dd.mm.yyyy"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Vaqt bo'yicha filter"
        />
      </TableCell>
    </TableRow>
  )
}
