import { TABLE_FILTER_CELL_CLASS, TABLE_FILTER_FIELD_CLASS, BORDERLESS_FILTER_ROW_CLASS } from '@/components/shared/table-filter-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  RECEIPT_PAYMENT_TYPES,
  RECEIPT_PAYMENT_TYPE_LABELS,
  RECEIPT_STATUSES,
  RECEIPT_STATUS_LABELS,
} from '@/lib/stock-receipt'
import type { StockReceiptTableFilters } from './stock-receipt-table-filters'

interface StockReceiptTableFiltersRowProps {
  filters: StockReceiptTableFilters
  disabled?: boolean
  onChange: (patch: Partial<StockReceiptTableFilters>) => void
}

export function StockReceiptTableFiltersRow({
  filters,
  disabled,
  onChange,
}: StockReceiptTableFiltersRowProps) {
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
          value={filters.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Kirim nomi"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Kirim nomi bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({
              status: value as StockReceiptTableFilters['status'],
            })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Holat bo'yicha filter"
          >
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {RECEIPT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {RECEIPT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.paymentType}
          onValueChange={(value) =>
            onChange({
              paymentType: value as StockReceiptTableFilters['paymentType'],
            })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="To'lov turi bo'yicha filter"
          >
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {RECEIPT_PAYMENT_TYPES.map((paymentType) => (
              <SelectItem key={paymentType} value={paymentType}>
                {RECEIPT_PAYMENT_TYPE_LABELS[paymentType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.supplierName}
          onChange={(e) => onChange({ supplierName: e.target.value })}
          placeholder="Yetkazib beruvchi"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Yetkazib beruvchi bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.warehouseName}
          onChange={(e) => onChange({ warehouseName: e.target.value })}
          placeholder="Ombor"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Ombor bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.createdAt}
          onChange={(e) => onChange({ createdAt: e.target.value })}
          placeholder="dd.mm.yyyy"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Saqlangan vaqt bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.exchangeRate}
          onChange={(e) => onChange({ exchangeRate: e.target.value })}
          placeholder="Kurs"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Kurs bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.totalAmount}
          onChange={(e) => onChange({ totalAmount: e.target.value })}
          placeholder="Umumiy narx"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Umumiy narx bo'yicha filter"
        />
      </TableCell>
    </TableRow>
  )
}
