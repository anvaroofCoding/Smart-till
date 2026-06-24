import { TableRow, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PaymentTypeTableFilters } from '@/components/payment-types/payment-type-table-filters'

interface PaymentTypeTableFiltersRowProps {
  filters: PaymentTypeTableFilters
  disabled?: boolean
  onChange: (patch: Partial<PaymentTypeTableFilters>) => void
}

export function PaymentTypeTableFiltersRow({
  filters,
  disabled,
  onChange,
}: PaymentTypeTableFiltersRowProps) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell />
      <TableCell>
        <Input
          value={filters.id}
          onChange={(e) => onChange({ id: e.target.value })}
          placeholder="ID"
          disabled={disabled}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          value={filters.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Nomi"
          disabled={disabled}
          className="h-8"
        />
      </TableCell>
      <TableCell />
      <TableCell>
        <Select
          value={filters.status}
          onValueChange={(status: PaymentTypeTableFilters['status']) =>
            onChange({ status })
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="inactive">Nofaol</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={filters.createdAt}
          onChange={(e) => onChange({ createdAt: e.target.value })}
          placeholder="dd.MM.yyyy"
          disabled={disabled}
          className="h-8"
        />
      </TableCell>
      <TableCell />
      <TableCell />
    </TableRow>
  )
}
