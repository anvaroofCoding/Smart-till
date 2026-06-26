import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { ProductImageThumb } from '@/components/products/product-image-thumb'
import {
  emptyProductTableFilters,
  productFiltersToQueryParams,
  type ProductTableFilters,
} from '@/components/products/product-table-filters'
import { ProductTableFiltersRow } from '@/components/products/products-table-filters-row'
import { TruncatedDescriptionCell } from '@/components/shared/truncated-description-cell'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { pageTitle } from '@/config/seo'
import { formatDateDisplay } from '@/lib/date-format'
import { getApiErrorMessage } from '@/lib/api-error'
import { DEFAULT_PER_PAGE } from '@/lib/pagination'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useGetProductBrandsQuery } from '@/store/api/product-brands.api'
import { useGetProductCategoriesQuery } from '@/store/api/product-categories.api'
import {
  useGetProductsQuery,
  useSetProductStatusMutation,
} from '@/store/api/products.api'
import type { ProductRecord } from '@/types/product.types'

const PRODUCTS_LIST_PATH = '/maxsulotlar/ro-yxat'
const PRODUCT_CREATE_PATH = '/maxsulotlar/ro-yxat/yaratish'

const TABLE_HEADERS = [
  '№',
  'ID',
  'Maxsulot kodi',
  'Brend',
  'Maxsulot nomi',
  'Izoh',
  'Holat',
  'Kategoriya',
  'Saqlangan vaqti',
  'Rasm',
  'Amallar',
] as const

function ProductActiveSwitch({
  product,
  disabled,
  onToggle,
}: {
  product: ProductRecord
  disabled?: boolean
  onToggle: (isActive: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`product-active-${product.id}`}
        checked={product.isActive}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={
          product.isActive
            ? `${product.name} maxsulotini nofaol qilish`
            : `${product.name} maxsulotini faol qilish`
        }
      />
      <Label
        htmlFor={`product-active-${product.id}`}
        className={cn(
          'cursor-pointer text-xs font-medium',
          product.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {product.isActive ? 'Faol' : 'Nofaol'}
      </Label>
    </div>
  )
}

export function ProductsPage() {
  const [filters, setFilters] = useState<ProductTableFilters>(
    emptyProductTableFilters,
  )
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => productFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const categoriesQuery = useGetProductCategoriesQuery({ page: 1, perPage: 100 })
  const brandsQuery = useGetProductBrandsQuery({ page: 1, perPage: 100 })

  const productsQuery = useGetProductsQuery({
    ...filterQuery,
    page,
    perPage,
  })

  const [setProductStatus] = useSetProductStatusMutation()

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(productsQuery)

  usePageMeta({
    title: pageTitle('Maxsulotlar', 'Maxsulotlar'),
  })

  const products = productsQuery.data?.data ?? []
  const paginationMeta = productsQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  useEffect(() => {
    if (!productsQuery.error) return
    notify.error(
      getApiErrorMessage(productsQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [productsQuery.error])

  function handleFilterChange(patch: Partial<ProductTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  async function handleToggleActive(product: ProductRecord, isActive: boolean) {
    setTogglingId(product.id)
    try {
      await setProductStatus({ id: product.id, isActive }).unwrap()
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Holatni o\'zgartirish amalga oshmadi'),
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maxsulotlar</h1>
        </div>
        <Button asChild>
          <Link to={PRODUCT_CREATE_PATH}>
            <AppIcon name="plus" />
            Yangi maxsulot
          </Link>
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
          <div className="min-h-0 flex-1 overflow-auto">
            {showTableSkeleton ? (
              <DataTableSkeleton
                columns={TABLE_HEADERS.length}
                rows={6}
                headers={[...TABLE_HEADERS]}
              />
            ) : (
              <Table className={BORDERLESS_TABLE_CLASS}>
                <TableHeader>
                  <TableRow>
                    {TABLE_HEADERS.map((header) => (
                      <TableHead
                        key={header}
                        className={
                          header === '№'
                            ? 'w-12 text-center'
                            : header === 'Amallar'
                              ? 'text-right'
                              : header === 'Rasm'
                                ? 'w-14'
                                : undefined
                        }
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                  <ProductTableFiltersRow
                    filters={filters}
                    brands={brandsQuery.data?.data ?? []}
                    categories={categoriesQuery.data?.data ?? []}
                    disabled={showTableRefreshing}
                    onChange={handleFilterChange}
                  />
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={TABLE_HEADERS.length}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Maxsulotlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product, index) => {
                      const currentPage = productsQuery.data?.meta.page ?? 1
                      const currentPerPage = productsQuery.data?.meta.perPage ?? DEFAULT_PER_PAGE
                      const rowNumber =
                        (currentPage - 1) * currentPerPage + index + 1

                      return (
                        <TableRow
                          key={product.id}
                          className={cn(!product.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[88px] truncate font-mono text-xs">
                            {product.id.slice(-8)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {product.code || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.brand.name}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] font-medium">
                            <span className="line-clamp-2">{product.name}</span>
                          </TableCell>
                          <TableCell className="max-w-[160px] text-sm">
                            <TruncatedDescriptionCell
                              title={product.name}
                              description={product.description}
                              dialogSubtitle="Maxsulot izohi"
                              lines={2}
                              className="max-w-[160px]"
                            />
                          </TableCell>
                          <TableCell>
                            <ProductActiveSwitch
                              product={product}
                              disabled={togglingId === product.id}
                              onToggle={(isActive) =>
                                handleToggleActive(product, isActive)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.category.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {formatDateDisplay(product.createdAt) || '—'}
                          </TableCell>
                          <TableCell>
                            <ProductImageThumb
                              image={product.image}
                              name={product.name}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                to={`${PRODUCTS_LIST_PATH}/${product.id}/tahrirlash`}
                                aria-label="Tahrirlash"
                              >
                                <AppIcon name="pencil" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {!showTableSkeleton && (
            <DataTablePagination
              meta={paginationMeta}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              disabled={showTableRefreshing}
            />
          )}

          <QueryRefreshIndicator visible={showTableRefreshing} />
      </div>
    </div>
  )
}
