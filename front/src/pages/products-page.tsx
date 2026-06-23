import { useState } from 'react'
import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { ProductImageThumb } from '@/components/products/product-image-thumb'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { usePageMeta } from '@/hooks/use-page-meta'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import {
  useGetProductsQuery,
  useSetProductStatusMutation,
} from '@/store/api/products.api'
import type { ProductRecord } from '@/types/product.types'

const PRODUCTS_LIST_PATH = '/maxsulotlar/ro-yxat'
const PRODUCT_CREATE_PATH = '/maxsulotlar/ro-yxat/yaratish'

const TABLE_HEADERS = [
  '№',
  'Rasm',
  'Nomi',
  'Kategoriya',
  'Brend',
  'Holat',
  'Amallar',
]

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
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { page, perPage, setPage, setPerPage } = useListPagination(search)

  const productsQuery = useGetProductsQuery({
    search: search.trim() || undefined,
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

  async function handleToggleActive(product: ProductRecord, isActive: boolean) {
    setActionError(null)
    setTogglingId(product.id)
    try {
      await setProductStatus({ id: product.id, isActive }).unwrap()
    } catch (err) {
      setActionError(
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
          <p className="text-muted-foreground mt-1 text-sm">
            Onlayn kiritish uchun. Nom, kategoriya va brend majburiy. Rasm
            ixtiyoriy.
          </p>
        </div>
        <Button asChild>
          <Link to={PRODUCT_CREATE_PATH}>
            <AppIcon name="plus" />
            Yangi maxsulot
          </Link>
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="package" />
            Maxsulotlar ro&apos;yxati
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="relative w-full max-w-md shrink-0">
            <AppIcon
              name="search"
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish"
              className="pl-9"
            />
          </div>

          {productsQuery.error && (
            <p className="text-destructive text-sm">
              {getApiErrorMessage(
                productsQuery.error,
                "Ro'yxatni yuklab bo'lmadi",
              )}
            </p>
          )}
          {actionError && (
            <p className="text-destructive text-sm">{actionError}</p>
          )}

          <div className="min-h-0 flex-1 overflow-auto">
            {showTableSkeleton ? (
              <DataTableSkeleton
                columns={7}
                rows={6}
                headers={TABLE_HEADERS}
              />
            ) : (
              <Table>
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
                              : undefined
                        }
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Maxsulotlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product, index) => {
                      const page = productsQuery.data?.meta.page ?? 1
                      const perPage = productsQuery.data?.meta.perPage ?? 20
                      const rowNumber = (page - 1) * perPage + index + 1

                      return (
                        <TableRow
                          key={product.id}
                          className={cn(!product.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell>
                            <ProductImageThumb
                              image={product.image}
                              name={product.name}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.category.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.brand.name}</Badge>
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
        </CardContent>
      </Card>
    </div>
  )
}
