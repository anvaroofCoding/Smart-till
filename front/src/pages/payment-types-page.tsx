import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { PaymentTypeDeleteButton } from '@/components/payment-types/payment-type-delete-button'
import { PaymentTypeLogoThumb } from '@/components/payment-types/payment-type-logo-thumb'
import {
  emptyPaymentTypeTableFilters,
  paymentTypeFiltersToQueryParams,
  type PaymentTypeTableFilters,
} from '@/components/payment-types/payment-type-table-filters'
import { PaymentTypeTableFiltersRow } from '@/components/payment-types/payment-type-table-filters-row'
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
import {
  useDeletePaymentTypeMutation,
  useGetPaymentTypesQuery,
  useSetPaymentTypeStatusMutation,
} from '@/store/api/payment-types.api'
import {
  isSystemPaymentType,
  type PaymentTypeRecord,
} from '@/types/payment-type.types'

const PAYMENT_TYPES_LIST_PATH = '/to-lov/turlari'
const PAYMENT_TYPE_CREATE_PATH = '/to-lov/turlari/yaratish'

const TABLE_HEADERS = [
  '№',
  'ID',
  "To'lov turi",
  "Bo'lib to'lash",
  'Holat',
  'Saqlangan vaqti',
  'Logo',
  'Amallar',
] as const

function PaymentTypeActiveSwitch({
  paymentType,
  disabled,
  onToggle,
}: {
  paymentType: PaymentTypeRecord
  disabled?: boolean
  onToggle: (isActive: boolean) => void
}) {
  const locked = isSystemPaymentType(paymentType)

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`payment-type-active-${paymentType.id}`}
        checked={paymentType.isActive}
        disabled={disabled || locked}
        onCheckedChange={onToggle}
        aria-label={
          paymentType.isActive
            ? `${paymentType.name} to'lov turini nofaol qilish`
            : `${paymentType.name} to'lov turini faol qilish`
        }
      />
      <Label
        htmlFor={`payment-type-active-${paymentType.id}`}
        className={cn(
          'cursor-pointer text-xs font-medium',
          paymentType.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {paymentType.isActive ? 'Faol' : 'Nofaol'}
      </Label>
    </div>
  )
}

export function PaymentTypesPage() {
  const [filters, setFilters] = useState<PaymentTypeTableFilters>(
    emptyPaymentTypeTableFilters,
  )
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => paymentTypeFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const paymentTypesQuery = useGetPaymentTypesQuery({
    ...filterQuery,
    page,
    perPage,
  })

  const [setPaymentTypeStatus] = useSetPaymentTypeStatusMutation()
  const [deletePaymentType] = useDeletePaymentTypeMutation()

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(paymentTypesQuery)

  usePageMeta({
    title: pageTitle("To'lov turlari", "To'lov"),
  })

  const paymentTypes = paymentTypesQuery.data?.data ?? []
  const paginationMeta = paymentTypesQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  useEffect(() => {
    if (!paymentTypesQuery.error) return
    notify.error(
      getApiErrorMessage(paymentTypesQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [paymentTypesQuery.error])

  function handleFilterChange(patch: Partial<PaymentTypeTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  async function handleToggleActive(
    paymentType: PaymentTypeRecord,
    isActive: boolean,
  ) {
    setTogglingId(paymentType.id)
    try {
      await setPaymentTypeStatus({ id: paymentType.id, isActive }).unwrap()
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Holatni o\'zgartirish amalga oshmadi'),
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(paymentType: PaymentTypeRecord) {
    setDeletingId(paymentType.id)
    try {
      await deletePaymentType(paymentType.id).unwrap()
      notify.success("To'lov turi o'chirildi")
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, "To'lov turini o'chirib bo'lmadi"),
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
            To&apos;lov turlari
          </h1>
        </div>
        <Button asChild>
          <Link to={PAYMENT_TYPE_CREATE_PATH}>
            <AppIcon name="plus" />
            Yangi to&apos;lov turi
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
                              : header === 'Logo'
                                ? 'w-14'
                                : undefined
                        }
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                  <PaymentTypeTableFiltersRow
                    filters={filters}
                    disabled={showTableRefreshing}
                    onChange={handleFilterChange}
                  />
                </TableHeader>
                <TableBody>
                  {paymentTypes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={TABLE_HEADERS.length}
                        className="text-muted-foreground h-24 text-center"
                      >
                        To&apos;lov turlari topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentTypes.map((paymentType, index) => {
                      const currentPage = paymentTypesQuery.data?.meta.page ?? 1
                      const currentPerPage =
                        paymentTypesQuery.data?.meta.perPage ?? DEFAULT_PER_PAGE
                      const rowNumber =
                        (currentPage - 1) * currentPerPage + index + 1

                      return (
                        <TableRow
                          key={paymentType.id}
                          className={cn(!paymentType.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[88px] truncate font-mono text-xs">
                            {paymentType.id.slice(-8)}
                          </TableCell>
                          <TableCell className="max-w-[200px] font-medium">
                            <span className="line-clamp-2">
                              {paymentType.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                paymentType.installmentPlans.length > 0
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {paymentType.installmentPlans.length > 0
                                ? 'Ha'
                                : "Yo'q"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <PaymentTypeActiveSwitch
                              paymentType={paymentType}
                              disabled={togglingId === paymentType.id}
                              onToggle={(isActive) =>
                                handleToggleActive(paymentType, isActive)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {formatDateDisplay(paymentType.createdAt) || '—'}
                          </TableCell>
                          <TableCell>
                            <PaymentTypeLogoThumb
                              logo={paymentType.logo}
                              name={paymentType.name}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  to={`${PAYMENT_TYPES_LIST_PATH}/${paymentType.id}/tahrirlash`}
                                  aria-label="Tahrirlash"
                                >
                                  <AppIcon name="pencil" />
                                </Link>
                              </Button>
                              {!isSystemPaymentType(paymentType) && (
                                <PaymentTypeDeleteButton
                                  name={paymentType.name}
                                  isDeleting={deletingId === paymentType.id}
                                  onConfirmDelete={() => handleDelete(paymentType)}
                                />
                              )}
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
    </div>
  )
}
