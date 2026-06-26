import {
  BORDERLESS_FILTER_ROW_CLASS,
  TABLE_FILTER_CELL_CLASS,
  TABLE_FILTER_FIELD_CLASS,
} from '@/components/shared/table-filter-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableCell, TableRow } from '@/components/ui/table'
import { TRANSFER_STATUS_LABELS } from '@/lib/warehouse-transfer'
import type { WarehouseRecord } from '@/types/warehouse.types'
import type { TransferTableFilters } from './transfer-table-filters'

const ALL_VALUE = '__all__'

interface TransferIncomingTableFiltersRowProps {
  filters: TransferTableFilters
  warehouses: WarehouseRecord[]
  disabled?: boolean
  onChange: (patch: Partial<TransferTableFilters>) => void
}

export function TransferIncomingTableFiltersRow({
  filters,
  warehouses,
  disabled,
  onChange,
}: TransferIncomingTableFiltersRowProps) {
  return (
    <TableRow className={BORDERLESS_FILTER_ROW_CLASS}>
      <TableCell className={TABLE_FILTER_CELL_CLASS} />
      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Nom bo'yicha filter"
        />
      </TableCell>
      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.code}
          onChange={(e) => onChange({ code: e.target.value })}
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Kod bo'yicha filter"
        />
      </TableCell>
      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.fromWarehouseId || ALL_VALUE}
          onValueChange={(value) =>
            onChange({ fromWarehouseId: value === ALL_VALUE ? '' : value })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Yuboruvchi ombor bo'yicha filter"
          >
            <SelectValue placeholder="Barcha omborlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Barcha omborlar</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.toWarehouseId || ALL_VALUE}
          onValueChange={(value) =>
            onChange({ toWarehouseId: value === ALL_VALUE ? '' : value })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Qabul qiluvchi ombor bo'yicha filter"
          >
            <SelectValue placeholder="Barcha omborlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Barcha omborlar</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.transferDate}
          onChange={(e) => onChange({ transferDate: e.target.value })}
          disabled={disabled}
          placeholder="dd.mm.yyyy"
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Sana bo'yicha filter"
        />
      </TableCell>
      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.status || ALL_VALUE}
          onValueChange={(value) =>
            onChange({
              status:
                value === ALL_VALUE
                  ? ''
                  : (value as Extract<
                      TransferTableFilters['status'],
                      'draft' | 'sent' | 'completed'
                    >),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Holat bo'yicha filter"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Barcha holatlar</SelectItem>
            <SelectItem value="draft">{TRANSFER_STATUS_LABELS.draft}</SelectItem>
            <SelectItem value="sent">{TRANSFER_STATUS_LABELS.sent}</SelectItem>
            <SelectItem value="completed">
              {TRANSFER_STATUS_LABELS.completed}
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className={TABLE_FILTER_CELL_CLASS} />
    </TableRow>
  )
}
