import { TABLE_FILTER_CELL_CLASS, TABLE_FILTER_FIELD_CLASS } from '@/components/shared/table-filter-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableCell, TableRow } from '@/components/ui/table'
import type { BrandTableFilters } from './brand-table-filters'

interface BrandTableFiltersRowProps {
  filters: BrandTableFilters
  disabled?: boolean
  onChange: (patch: Partial<BrandTableFilters>) => void
}

export function BrandTableFiltersRow({
  filters,
  disabled,
  onChange,
}: BrandTableFiltersRowProps) {
  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
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
          placeholder="Nomi"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Brend nomi bo'yicha filter"
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
            onChange({ status: value as BrandTableFilters['status'] })
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

      <TableCell className={TABLE_FILTER_CELL_CLASS} />
    </TableRow>
  )
}
