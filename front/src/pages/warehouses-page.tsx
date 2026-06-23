import { useEffect, useState } from 'react'

import {
  WarehouseFormDialog,
  type WarehouseFormValues,
} from '@/components/warehouses/warehouse-form-dialog'
import { AppIcon } from '@/components/icons/app-icon'
import { DataTablePagination } from '@/components/data-table-pagination'
import { TruncatedDescriptionCell } from '@/components/shared/truncated-description-cell'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  useCreateWarehouseMutation,
  useDeleteWarehouseMutation,
  useGetWarehousesQuery,
  useSetWarehouseStatusMutation,
  useUpdateWarehouseMutation,
} from '@/store/api/warehouses.api'
import type { WarehouseRecord } from '@/types/warehouse.types'

const TABLE_HEADERS = ['№', 'Nomi', 'Manzil', 'Izoh', 'Holat', 'Amallar']

function WarehouseActiveSwitch({
  warehouse,
  disabled,
  onToggle,
}: {
  warehouse: WarehouseRecord
  disabled?: boolean
  onToggle: (isActive: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`warehouse-active-${warehouse.id}`}
        checked={warehouse.isActive}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={
          warehouse.isActive
            ? `${warehouse.name} omborini nofaol qilish`
            : `${warehouse.name} omborini faol qilish`
        }
      />
      <Label
        htmlFor={`warehouse-active-${warehouse.id}`}
        className={cn(
          'cursor-pointer text-xs font-medium',
          warehouse.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {warehouse.isActive ? 'Faol' : 'Nofaol'}
      </Label>
    </div>
  )
}

function WarehouseDeleteButton({
  warehouse,
  isDeleting,
  onConfirmDelete,
}: {
  warehouse: WarehouseRecord
  isDeleting?: boolean
  onConfirmDelete: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    try {
      await onConfirmDelete()
      setOpen(false)
    } catch {
      // Xatolik bo'lsa dialog ochiq qoladi.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          aria-label={`${warehouse.name} omborini o'chirish`}
          className="text-destructive hover:text-destructive"
        >
          <AppIcon name="trash-2" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Omborni o&apos;chirasizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-medium">{warehouse.name}</span>{' '}
            butunlay o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Bekor qilish</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function WarehousesPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseRecord | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { page, perPage, setPage, setPerPage } = useListPagination(search)

  const warehousesQuery = useGetWarehousesQuery({
    search: search.trim() || undefined,
    page,
    perPage,
  })

  const [createWarehouse, createState] = useCreateWarehouseMutation()
  const [updateWarehouse, updateState] = useUpdateWarehouseMutation()
  const [setWarehouseStatus] = useSetWarehouseStatusMutation()
  const [deleteWarehouse] = useDeleteWarehouseMutation()

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(warehousesQuery)

  usePageMeta({
    title: pageTitle("Omborlar ro'yxati", 'Omborlar'),
  })

  const warehouses = warehousesQuery.data?.data ?? []
  const paginationMeta = warehousesQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }
  const isSaving = createState.isLoading || updateState.isLoading

  useEffect(() => {
    if (!warehousesQuery.error) return
    notify.error(
      getApiErrorMessage(warehousesQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [warehousesQuery.error])

  function openCreateDialog() {
    setDialogMode('create')
    setEditingWarehouse(null)
    setDialogOpen(true)
  }

  function openEditDialog(warehouse: WarehouseRecord) {
    setDialogMode('edit')
    setEditingWarehouse(warehouse)
    setDialogOpen(true)
  }

  async function handleFormSubmit(values: WarehouseFormValues) {
    const payload = {
      name: values.name.trim(),
      address: values.address.trim() || undefined,
      description: values.description.trim() || undefined,
      isActive: values.isActive,
    }

    try {
      if (dialogMode === 'create') {
        await createWarehouse(payload).unwrap()
        notify.success("Ombor qo'shildi")
      } else if (editingWarehouse) {
        await updateWarehouse({
          id: editingWarehouse.id,
          body: payload,
        }).unwrap()
        notify.success('Ombor saqlandi')
      }
      setDialogOpen(false)
    } catch (err) {
      notify.error(
        getApiErrorMessage(
          err,
          dialogMode === 'create'
            ? "Ombor qo'shish amalga oshmadi"
            : 'Omborni saqlash amalga oshmadi',
        ),
      )
    }
  }

  async function handleToggleActive(
    warehouse: WarehouseRecord,
    isActive: boolean,
  ) {
    setTogglingId(warehouse.id)
    try {
      await setWarehouseStatus({ id: warehouse.id, isActive }).unwrap()
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, "Holatni o'zgartirish amalga oshmadi"),
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(warehouse: WarehouseRecord) {
    setDeletingId(warehouse.id)
    try {
      await deleteWarehouse(warehouse.id).unwrap()
      notify.success("Ombor o'chirildi")
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, "Omborni o'chirib bo'lmadi"),
        { title: "O'chirib bo'lmadi" },
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
            Omborlar ro&apos;yxati
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Onlayn kiritish uchun. Ombor nomi majburiy, manzil, izoh va holat
            ixtiyoriy.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <AppIcon name="plus" />
          Yangi ombor
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="warehouse" />
            Omborlar
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
                columns={6}
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
                  {warehouses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Omborlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    warehouses.map((warehouse, index) => {
                      const page = warehousesQuery.data?.meta.page ?? 1
                      const perPage = warehousesQuery.data?.meta.perPage ?? 20
                      const rowNumber = (page - 1) * perPage + index + 1

                      return (
                        <TableRow
                          key={warehouse.id}
                          className={cn(!warehouse.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {warehouse.name}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <TruncatedDescriptionCell
                              title={warehouse.name}
                              description={warehouse.address}
                              dialogSubtitle="Ombor manzili"
                            />
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <TruncatedDescriptionCell
                              title={warehouse.name}
                              description={warehouse.description}
                              dialogSubtitle="Ombor izohi"
                            />
                          </TableCell>
                          <TableCell>
                            <WarehouseActiveSwitch
                              warehouse={warehouse}
                              disabled={togglingId === warehouse.id}
                              onToggle={(isActive) =>
                                handleToggleActive(warehouse, isActive)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(warehouse)}
                                aria-label="Tahrirlash"
                              >
                                <AppIcon name="pencil" />
                              </Button>
                              <WarehouseDeleteButton
                                warehouse={warehouse}
                                isDeleting={deletingId === warehouse.id}
                                onConfirmDelete={() => handleDelete(warehouse)}
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

      <WarehouseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        warehouse={editingWarehouse}
        isSaving={isSaving}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
