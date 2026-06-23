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
import type { ProductBrandRecord } from '@/types/product-brand.types'
import type { ProductCategoryRecord } from '@/types/product-category.types'
import type { ProductTableFilters } from './product-table-filters'

const ALL_VALUE = '__all__'

interface ProductTableFiltersRowProps {
  filters: ProductTableFilters
  brands: ProductBrandRecord[]
  categories: ProductCategoryRecord[]
  disabled?: boolean
  onChange: (patch: Partial<ProductTableFilters>) => void
}

export function ProductTableFiltersRow({
  filters,
  brands,
  categories,
  disabled,
  onChange,
}: ProductTableFiltersRowProps) {
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
          value={filters.code}
          onChange={(e) => onChange({ code: e.target.value })}
          placeholder="Kod"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Maxsulot kodi bo'yicha filter"
        />
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Select
          value={filters.brandId || ALL_VALUE}
          onValueChange={(value) =>
            onChange({ brandId: value === ALL_VALUE ? '' : value })
          }
          disabled={disabled}
        >
          <SelectTrigger
            size="sm"
            className={TABLE_FILTER_FIELD_CLASS}
            aria-label="Brend bo'yicha filter"
          >
            <SelectValue placeholder="Barcha brendlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Barcha brendlar</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className={TABLE_FILTER_CELL_CLASS}>
        <Input
          value={filters.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Maxsulot nomi"
          disabled={disabled}
          className={TABLE_FILTER_FIELD_CLASS}
          aria-label="Maxsulot nomi bo'yicha filter"
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
            onChange({
              status: value as ProductTableFilters['status'],
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
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="inactive">Nofaol</SelectItem>
          </SelectContent>
        </Select>
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
            <SelectValue placeholder="Barcha kategoriyalar" />
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
      <TableCell className={TABLE_FILTER_CELL_CLASS} />
    </TableRow>
  )
}
