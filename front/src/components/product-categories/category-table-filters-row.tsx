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
import type { CategoryTableFilters } from './category-table-filters'

interface CategoryTableFiltersRowProps {
  filters: CategoryTableFilters
  disabled?: boolean
  onChange: (patch: Partial<CategoryTableFilters>) => void
}

export function CategoryTableFiltersRow({
  filters,
  disabled,
  onChange,
}: CategoryTableFiltersRowProps) {
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
          placeholder="Kategoriya nomi"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Kategoriya nomi bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Izoh"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Izoh bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ status: value as CategoryTableFilters['status'] })
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
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="inactive">Nofaol</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS} />
    </TableRow>
  )
}
