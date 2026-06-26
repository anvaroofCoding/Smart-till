import { useEffect, useMemo, useState } from 'react'

import {
  BrandFormDialog,
  type BrandFormValues,
} from '@/components/product-brands/brand-form-dialog'
import {
  emptyBrandTableFilters,
  brandFiltersToQueryParams,
  type BrandTableFilters,
} from '@/components/product-brands/brand-table-filters'
import { BrandTableFiltersRow } from '@/components/product-brands/brand-table-filters-row'
import { AppIcon } from '@/components/icons/app-icon'
import { DataTablePagination } from '@/components/data-table-pagination'
import { TruncatedDescriptionCell } from '@/components/shared/truncated-description-cell'
import { CatalogDeleteButton } from '@/components/shared/catalog-delete-button'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
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
import { getApiErrorMessage } from '@/lib/api-error'
import { DEFAULT_PER_PAGE } from '@/lib/pagination'
import { formatDateDisplay } from '@/lib/date-format'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  useCreateProductBrandMutation,
  useDeleteProductBrandMutation,
  useGetProductBrandsQuery,
  useSetProductBrandStatusMutation,
  useUpdateProductBrandMutation,
} from '@/store/api/product-brands.api'
import type { ProductBrandRecord } from '@/types/product-brand.types'

const TABLE_HEADERS = [
  '№',
  'ID',
  'Nomi',
  'Izoh',
  'Holat',
  'Saqlangan vaqti',
  'Amallar',
] as const

function BrandActiveSwitch({
  brand,
  disabled,
  onToggle,
}: {
  brand: ProductBrandRecord
  disabled?: boolean
  onToggle: (isActive: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`brand-active-${brand.id}`}
        checked={brand.isActive}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={
          brand.isActive
            ? `${brand.name} brendini nofaol qilish`
            : `${brand.name} brendini faol qilish`
        }
      />
      <Label
        htmlFor={`brand-active-${brand.id}`}
        className={cn(
          'cursor-pointer text-xs font-medium',
          brand.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {brand.isActive ? 'Faol' : 'Nofaol'}
      </Label>
    </div>
  )
}

export function ProductBrandsPage() {
  const [filters, setFilters] = useState<BrandTableFilters>(
    emptyBrandTableFilters,
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingBrand, setEditingBrand] = useState<ProductBrandRecord | null>(
    null,
  )
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => brandFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const brandsQuery = useGetProductBrandsQuery({
    ...filterQuery,
    page,
    perPage,
  })

  const [createBrand, createState] = useCreateProductBrandMutation()
  const [updateBrand, updateState] = useUpdateProductBrandMutation()
  const [setBrandStatus] = useSetProductBrandStatusMutation()
  const [deleteBrand] = useDeleteProductBrandMutation()

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(brandsQuery)

  usePageMeta({
    title: pageTitle('Maxsulot brendi', 'Maxsulotlar'),
  })

  const brands = brandsQuery.data?.data ?? []
  const paginationMeta = brandsQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }
  const isSaving = createState.isLoading || updateState.isLoading

  useEffect(() => {
    if (!brandsQuery.error) return
    notify.error(
      getApiErrorMessage(brandsQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [brandsQuery.error])

  function handleFilterChange(patch: Partial<BrandTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function openCreateDialog() {
    setDialogMode('create')
    setEditingBrand(null)
    setDialogOpen(true)
  }

  function openEditDialog(brand: ProductBrandRecord) {
    setDialogMode('edit')
    setEditingBrand(brand)
    setDialogOpen(true)
  }

  async function handleFormSubmit(values: BrandFormValues) {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      isActive: values.isActive,
    }

    try {
      if (dialogMode === 'create') {
        await createBrand(payload).unwrap()
        notify.success('Brend qo\'shildi')
      } else if (editingBrand) {
        await updateBrand({
          id: editingBrand.id,
          body: payload,
        }).unwrap()
        notify.success('Brend saqlandi')
      }
      setDialogOpen(false)
    } catch (err) {
      notify.error(
        getApiErrorMessage(
          err,
          dialogMode === 'create'
            ? 'Brend qo\'shish amalga oshmadi'
            : 'Brendni saqlash amalga oshmadi',
        ),
      )
    }
  }

  async function handleToggleActive(brand: ProductBrandRecord, isActive: boolean) {
    setTogglingId(brand.id)
    try {
      await setBrandStatus({ id: brand.id, isActive }).unwrap()
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Holatni o\'zgartirish amalga oshmadi'),
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(brand: ProductBrandRecord) {
    setDeletingId(brand.id)
    try {
      await deleteBrand(brand.id).unwrap()
      notify.success('Brend o\'chirildi')
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Brendni o\'chirib bo\'lmadi'),
        { title: 'O\'chirib bo\'lmadi' },
      )
      throw err
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Maxsulot brendi
          </h1>
        </div>
        <Button onClick={openCreateDialog}>
          <AppIcon name="plus" />
          Yangi brend
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
                              : undefined
                        }
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                  <BrandTableFiltersRow
                    filters={filters}
                    disabled={showTableRefreshing}
                    onChange={handleFilterChange}
                  />
                </TableHeader>
                <TableBody>
                  {brands.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={TABLE_HEADERS.length}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Brendlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    brands.map((brand, index) => {
                      const currentPage = brandsQuery.data?.meta.page ?? 1
                      const currentPerPage = brandsQuery.data?.meta.perPage ?? DEFAULT_PER_PAGE
                      const rowNumber =
                        (currentPage - 1) * currentPerPage + index + 1

                      return (
                        <TableRow
                          key={brand.id}
                          className={cn(!brand.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[88px] truncate font-mono text-xs">
                            {brand.id.slice(-8)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {brand.name}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <TruncatedDescriptionCell
                              title={brand.name}
                              description={brand.description}
                              dialogSubtitle="Brend izohi"
                            />
                          </TableCell>
                          <TableCell>
                            <BrandActiveSwitch
                              brand={brand}
                              disabled={togglingId === brand.id}
                              onToggle={(isActive) =>
                                handleToggleActive(brand, isActive)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {formatDateDisplay(brand.createdAt) || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(brand)}
                                aria-label="Tahrirlash"
                              >
                                <AppIcon name="pencil" />
                              </Button>
                              <CatalogDeleteButton
                                name={brand.name}
                                productsCount={brand.productsCount ?? 0}
                                entityType="brend"
                                isDeleting={deletingId === brand.id}
                                onConfirmDelete={() => handleDelete(brand)}
                              />
                            </div>
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

      <BrandFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        brand={editingBrand}
        isSaving={isSaving}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
