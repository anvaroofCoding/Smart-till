import { BORDERLESS_FILTER_ROW_CLASS } from '@/components/shared/table-filter-field'
import { TableRow, TableCell } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WarehouseRecord } from '@/types/warehouse.types'
import {
  ALL_WAREHOUSES_LABEL,
  ALL_WAREHOUSES_VALUE,
  PRICE_SETTING_TYPE_LABELS,
  type PriceSettingType,
} from '@/types/price-setting.types'
import type { PriceSettingTableFilters } from '@/components/price-settings/price-setting-table-filters'

interface PriceSettingTableFiltersRowProps {
  filters: PriceSettingTableFilters
  warehouses: WarehouseRecord[]
  disabled?: boolean
  onChange: (patch: Partial<PriceSettingTableFilters>) => void
}

export function PriceSettingTableFiltersRow({
  filters,
  warehouses,
  disabled,
  onChange,
}: PriceSettingTableFiltersRowProps) {
  return (
    <TableRow className={BORDERLESS_FILTER_ROW_CLASS}>
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
        <Select
          value={filters.settingType}
          onValueChange={(settingType: PriceSettingTableFilters['settingType']) =>
            onChange({ settingType })
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Sozlama turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {(Object.keys(PRICE_SETTING_TYPE_LABELS) as PriceSettingType[]).map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {PRICE_SETTING_TYPE_LABELS[type]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={filters.warehouseId || 'all'}
          onValueChange={(warehouseId) =>
            onChange({ warehouseId: warehouseId === 'all' ? '' : warehouseId })
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Filial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value={ALL_WAREHOUSES_VALUE}>
              {ALL_WAREHOUSES_LABEL}
            </SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={filters.targetName}
          onChange={(e) => onChange({ targetName: e.target.value })}
          placeholder="Belgilovchi"
          disabled={disabled}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          value={filters.percentage}
          onChange={(e) => onChange({ percentage: e.target.value })}
          placeholder="Foiz"
          disabled={disabled}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Select
          value={filters.status}
          onValueChange={(status: PriceSettingTableFilters['status']) =>
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
    </TableRow>
  )
}
