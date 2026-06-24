import { TABLE_FILTER_CELL_CLASS, TABLE_FILTER_FIELD_CLASS } from '@/components/shared/table-filter-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import type { ProductCategoryRecord } from '@/types/product-category.types'
import type { ProductRecord } from '@/types/product.types'
import type { WarehouseRecord } from '@/types/warehouse.types'
import type { WarehouseStockTableFilters } from './warehouse-stock-table-filters'

const ALL_VALUE = '__all__'

interface WarehouseStockTableFiltersRowProps {
  filters: WarehouseStockTableFilters
  categories: ProductCategoryRecord[]
  products: ProductRecord[]
  warehouses: WarehouseRecord[]
  disabled?: boolean
  onChange: (patch: Partial<WarehouseStockTableFilters>) => void
}

export function WarehouseStockTableFiltersRow({
  filters,
  categories,
  products,
  warehouses,
  disabled,
  onChange,
}: WarehouseStockTableFiltersRowProps) {
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
        <Select
          value={filters.categoryId || ALL_VALUE}
          onValueChange={(value) =>
            onChange({ categoryId: value === ALL_VALUE ? '' : value })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Kategoriya bo'yicha filter"
          >
            <SelectValue placeholder="Kategoriya nomini kiriting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Barcha kategoriyalar</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.productId || ALL_VALUE}
          onValueChange={(value) =>
            onChange({ productId: value === ALL_VALUE ? '' : value })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Maxsulot bo'yicha filter"
          >
            <SelectValue placeholder="Maxsulot nomini kiriting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Barcha maxsulotlar</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.unitPrice}
          onChange={(e) => onChange({ unitPrice: e.target.value })}
          placeholder="Oxirgi kirim narxi"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Oxirgi kirim narxi bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.sellingPrice}
          onChange={(e) => onChange({ sellingPrice: e.target.value })}
          placeholder="Sotiladigan narx"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Sotiladigan narx bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.totalValue}
          onChange={(e) => onChange({ totalValue: e.target.value })}
          placeholder="Tovar qiymati"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Tovar qiymati bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.warehouseId || ALL_VALUE}
          onValueChange={(value) =>
            onChange({ warehouseId: value === ALL_VALUE ? '' : value })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Ombor bo'yicha filter"
          >
            <SelectValue placeholder="Ombor nomini kiriting" />
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
          value={filters.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
          placeholder="Ombordagi soni"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Ombordagi soni bo'yicha filter"
        />
      </TableCell>
    </TableRow>
  )
}
