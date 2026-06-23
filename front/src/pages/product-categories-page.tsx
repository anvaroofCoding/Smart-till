import { useEffect, useState } from 'react'

import {
  CategoryFormDialog,
  type CategoryFormValues,
} from '@/components/product-categories/category-form-dialog'
import { TruncatedDescriptionCell } from '@/components/shared/truncated-description-cell'
import { CatalogDeleteButton } from '@/components/shared/catalog-delete-button'
import { AppIcon } from '@/components/icons/app-icon'
import { DataTablePagination } from '@/components/data-table-pagination'
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
  useCreateProductCategoryMutation,
  useDeleteProductCategoryMutation,
  useGetProductCategoriesQuery,
  useSetProductCategoryStatusMutation,
  useUpdateProductCategoryMutation,
} from '@/store/api/product-categories.api'
import type { ProductCategoryRecord } from '@/types/product-category.types'

const TABLE_HEADERS = ['№', 'Nomi', 'Izoh', 'Holat', 'Amallar']

function CategoryActiveSwitch({
  category,
  disabled,
  onToggle,
}: {
  category: ProductCategoryRecord
  disabled?: boolean
  onToggle: (isActive: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`category-active-${category.id}`}
        checked={category.isActive}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={
          category.isActive
            ? `${category.name} kategoriyasini nofaol qilish`
            : `${category.name} kategoriyasini faol qilish`
        }
      />
      <Label
        htmlFor={`category-active-${category.id}`}
        className={cn(
          'cursor-pointer text-xs font-medium',
          category.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {category.isActive ? 'Faol' : 'Nofaol'}
      </Label>
    </div>
  )
}

export function ProductCategoriesPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingCategory, setEditingCategory] =
    useState<ProductCategoryRecord | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { page, perPage, setPage, setPerPage } = useListPagination(search)

  const categoriesQuery = useGetProductCategoriesQuery({
    search: search.trim() || undefined,
    page,
    perPage,
  })

  const [createCategory, createState] = useCreateProductCategoryMutation()
  const [updateCategory, updateState] = useUpdateProductCategoryMutation()
  const [setCategoryStatus] = useSetProductCategoryStatusMutation()
  const [deleteCategory] = useDeleteProductCategoryMutation()

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(categoriesQuery)

  usePageMeta({
    title: pageTitle('Maxsulot kategoriyasi', 'Maxsulotlar'),
  })

  const categories = categoriesQuery.data?.data ?? []
  const paginationMeta = categoriesQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }
  const isSaving = createState.isLoading || updateState.isLoading

  useEffect(() => {
    if (!categoriesQuery.error) return
    notify.error(
      getApiErrorMessage(categoriesQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [categoriesQuery.error])

  function openCreateDialog() {
    setDialogMode('create')
    setEditingCategory(null)
    setDialogOpen(true)
  }

  function openEditDialog(category: ProductCategoryRecord) {
    setDialogMode('edit')
    setEditingCategory(category)
    setDialogOpen(true)
  }

  async function handleFormSubmit(values: CategoryFormValues) {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      isActive: values.isActive,
    }

    try {
      if (dialogMode === 'create') {
        await createCategory(payload).unwrap()
        notify.success('Kategoriya qo\'shildi')
      } else if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          body: payload,
        }).unwrap()
        notify.success('Kategoriya saqlandi')
      }
      setDialogOpen(false)
    } catch (err) {
      notify.error(
        getApiErrorMessage(
          err,
          dialogMode === 'create'
            ? 'Kategoriya qo\'shish amalga oshmadi'
            : 'Kategoriyani saqlash amalga oshmadi',
        ),
      )
    }
  }

  async function handleToggleActive(
    category: ProductCategoryRecord,
    isActive: boolean,
  ) {
    setTogglingId(category.id)
    try {
      await setCategoryStatus({ id: category.id, isActive }).unwrap()
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Holatni o\'zgartirish amalga oshmadi'),
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(category: ProductCategoryRecord) {
    setDeletingId(category.id)
    try {
      await deleteCategory(category.id).unwrap()
      notify.success('Kategoriya o\'chirildi')
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Kategoriyani o\'chirib bo\'lmadi'),
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
            Maxsulot kategoriyasi
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Onlayn kiritish uchun. Nom majburiy, izoh va holat ixtiyoriy.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <AppIcon name="plus" />
          Yangi kategoriya
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="package" />
            Kategoriyalar ro&apos;yxati
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
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Kategoriyalar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category, index) => {
                      const page = categoriesQuery.data?.meta.page ?? 1
                      const perPage = categoriesQuery.data?.meta.perPage ?? 50
                      const rowNumber = (page - 1) * perPage + index + 1

                      return (
                        <TableRow
                          key={category.id}
                          className={cn(!category.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {category.name}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <TruncatedDescriptionCell
                              title={category.name}
                              description={category.description}
                              dialogSubtitle="Kategoriya izohi"
                            />
                          </TableCell>
                          <TableCell>
                            <CategoryActiveSwitch
                              category={category}
                              disabled={togglingId === category.id}
                              onToggle={(isActive) =>
                                handleToggleActive(category, isActive)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(category)}
                                aria-label="Tahrirlash"
                              >
                                <AppIcon name="pencil" />
                              </Button>
                              <CatalogDeleteButton
                                name={category.name}
                                productsCount={category.productsCount ?? 0}
                                entityType="kategoriya"
                                isDeleting={deletingId === category.id}
                                onConfirmDelete={() => handleDelete(category)}
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

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        category={editingCategory}
        isSaving={isSaving}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
