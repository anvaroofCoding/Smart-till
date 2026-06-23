import { useEffect, useState } from 'react'

import {
  BrandFormDialog,
  type BrandFormValues,
} from '@/components/product-brands/brand-form-dialog'
import { AppIcon } from '@/components/icons/app-icon'
import { DataTablePagination } from '@/components/data-table-pagination'
import { TruncatedDescriptionCell } from '@/components/shared/truncated-description-cell'
import { CatalogDeleteButton } from '@/components/shared/catalog-delete-button'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
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

const TABLE_HEADERS = ['№', 'Nomi', 'Izoh', 'Holat', 'Amallar']

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
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingBrand, setEditingBrand] = useState<ProductBrandRecord | null>(
    null,
  )
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { page, perPage, setPage, setPerPage } = useListPagination(search)

  const brandsQuery = useGetProductBrandsQuery({
    search: search.trim() || undefined,
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
          <p className="text-muted-foreground mt-1 text-sm">
            Onlayn kiritish uchun. Nom majburiy, izoh va holat ixtiyoriy.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <AppIcon name="plus" />
          Yangi brend
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="package" />
            Brendlar ro&apos;yxati
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

          <div className="min-h-0 flex-1 overflow-auto">
            {showTableSkeleton ? (
              <DataTableSkeleton
                columns={5}
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
                  {brands.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Brendlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    brands.map((brand, index) => {
                      const page = brandsQuery.data?.meta.page ?? 1
                      const perPage = brandsQuery.data?.meta.perPage ?? 20
                      const rowNumber = (page - 1) * perPage + index + 1

                      return (
                        <TableRow
                          key={brand.id}
                          className={cn(!brand.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
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
        </CardContent>
      </Card>

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
