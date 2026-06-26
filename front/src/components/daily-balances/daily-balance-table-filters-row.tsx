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
import type { WarehouseRecord } from '@/types/warehouse.types'
import type { DailyBalanceTableFilters } from './daily-balance-table-filters'

interface DailyBalanceTableFiltersRowProps {
  filters: DailyBalanceTableFilters
  warehouses: WarehouseRecord[]
  disabled?: boolean
  onChange: (patch: Partial<DailyBalanceTableFilters>) => void
}

export function DailyBalanceTableFiltersRow({
  filters,
  warehouses,
  disabled,
  onChange,
}: DailyBalanceTableFiltersRowProps) {
  return (
    <TableRow className={BORDERLESS_FILTER_ROW_CLASS}>
      <TableCell className={TABLE_FILTER_CELL_CLASS} />
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
          value={filters.dateKey}
          onChange={(e) => onChange({ dateKey: e.target.value })}
          placeholder="dd.mm.yyyy"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Kun bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.warehouseId}
          onValueChange={(value) => onChange({ warehouseId: value })}
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Filial bo'yicha filter"
          >
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
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
          value={filters.income}
          onChange={(e) => onChange({ income: e.target.value })}
          placeholder="Kirim"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Kirim bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.expense}
          onChange={(e) => onChange({ expense: e.target.value })}
          placeholder="Chiqim"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Chiqim bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.transferredToMain}
          onChange={(e) => onChange({ transferredToMain: e.target.value })}
          placeholder="Summa"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Asosiy balansga bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.savedAt}
          onChange={(e) => onChange({ savedAt: e.target.value })}
          placeholder="dd.mm.yyyy"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Saqlangan vaqt bo'yicha filter"
        />
      </TableCell>
    </TableRow>
  )
}
