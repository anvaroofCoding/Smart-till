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
import { useWarehouseStockCatalog } from '@/hooks/use-warehouse-stock-catalog'
import { pageTitle } from '@/config/seo'
import { formatMoney } from '@/lib/format-money'
import { getApiErrorMessage } from '@/lib/api-error'
import { DEFAULT_PER_PAGE } from '@/lib/pagination'
import { notify } from '@/lib/notify'
import { useGetProductBrandsQuery } from '@/store/api/product-brands.api'
import { useGetProductCategoriesQuery } from '@/store/api/product-categories.api'
import { useGetProductsQuery } from '@/store/api/products.api'

const SELLER_PRODUCTS_PATH = '/sotuvchilar/maxsulotlar'
const SELLER_ORDERS_PATH = '/sotuvchilar/buyurtmalar'

const TABLE_HEADERS = [
  '№',
  'Maxsulot kodi',
  'Brend',
  'Maxsulot nomi',
  'Kategoriya',
  'Narxi',
  'Qoldiq',
  'Rasm',
  'Amallar',
] as const

export function SellerProductsPage() {
  const [filters, setFilters] = useState<ProductTableFilters>(
    emptyProductTableFilters,
  )

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => productFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const categoriesQuery = useGetProductCategoriesQuery({ page: 1, perPage: 100 })
  const brandsQuery = useGetProductBrandsQuery({ page: 1, perPage: 100 })
  const stockCatalogQuery = useWarehouseStockCatalog()

  const productsQuery = useGetProductsQuery({
    ...filterQuery,
    page,
    perPage,
    isActive: true,
  })

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(productsQuery)

  usePageMeta({
    title: pageTitle('Maxsulotlar', 'Sotuvchilar'),
  })

  const products = productsQuery.data?.data ?? []
  const stockCatalog = stockCatalogQuery.catalog
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maxsulotlar</h1>
        </div>
        <Button asChild variant="outline">
          <Link to={SELLER_ORDERS_PATH}>
            <AppIcon name="plus" />
            Buyurtma qo&apos;shish
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
                    const currentPerPage =
                      productsQuery.data?.meta.perPage ?? DEFAULT_PER_PAGE
                    const rowNumber =
                      (currentPage - 1) * currentPerPage + index + 1
                    const stock = stockCatalog.get(product.id)

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="text-muted-foreground text-center tabular-nums">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          {product.code || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.brand.name}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] font-medium">
                          <span className="line-clamp-2">{product.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {product.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {stock ? formatMoney(stock.sellingPrice) : '—'}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {stock?.availableQuantity ?? '—'}
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
                              to={`${SELLER_PRODUCTS_PATH}/${product.id}`}
                              aria-label="Batafsil"
                            >
                              <AppIcon name="eye" />
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
