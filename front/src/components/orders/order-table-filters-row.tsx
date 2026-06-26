import { TABLE_FILTER_CELL_CLASS, TABLE_FILTER_FIELD_CLASS, BORDERLESS_FILTER_ROW_CLASS } from '@/components/shared/table-filter-field'
import { TableFilterDatePicker } from '@/components/shared/table-filter-date-picker'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableCell, TableRow } from '@/components/ui/table'
import { ORDER_STATUS_LABELS } from '@/lib/order-display'
import type { OrderTableFilters } from './order-table-filters'

const ALL_VALUE = '__all__'

export interface OrderCashierOption {
  id: string
  name: string
}

interface OrderTableFiltersRowProps {
  filters: OrderTableFilters
  cashiers: OrderCashierOption[]
  disabled?: boolean
  onChange: (patch: Partial<OrderTableFilters>) => void
}

export function OrderTableFiltersRow({
  filters,
  cashiers,
  disabled,
  onChange,
}: OrderTableFiltersRowProps) {
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
          placeholder="Mijoz ismi"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Mijoz ismi bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.customerPhone}
          onChange={(e) => onChange({ customerPhone: e.target.value })}
          placeholder="Telefon"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Mijoz raqami bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.subtotal}
          onChange={(e) => onChange({ subtotal: e.target.value })}
          placeholder="Narx"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Buyurtma narxi bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.total}
          onChange={(e) => onChange({ total: e.target.value })}
          placeholder="Jami"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Umumiy narx bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.discountTotal}
          onChange={(e) => onChange({ discountTotal: e.target.value })}
          placeholder="Chegirma"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Chegirma bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ status: value as OrderTableFilters['status'] })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Status bo'yicha filter"
          >
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="draft">{ORDER_STATUS_LABELS.draft}</SelectItem>
            <SelectItem value="pending_fulfillment">
              {ORDER_STATUS_LABELS.pending_fulfillment}
            </SelectItem>
            <SelectItem value="confirmed">
              {ORDER_STATUS_LABELS.confirmed}
            </SelectItem>
            <SelectItem value="cancelled">
              {ORDER_STATUS_LABELS.cancelled}
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.createdByName || ALL_VALUE}
          onValueChange={(value) =>
            onChange({ createdByName: value === ALL_VALUE ? '' : value })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Kassir bo'yicha filter"
          >
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Barchasi</SelectItem>
            {cashiers.map((cashier) => (
              <SelectItem key={cashier.id} value={cashier.name}>
                {cashier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <TableFilterDatePicker
          value={filters.createdAt}
          onChange={(value) => onChange({ createdAt: value })}
          disabled={disabled}
          aria-label="Saqlangan vaqt bo'yicha filter"
        />
      </TableCell>
    </TableRow>
  )
}
