import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { PriceSettingDeleteButton } from '@/components/price-settings/price-setting-delete-button'
import {
  emptyPriceSettingTableFilters,
  priceSettingFiltersToQueryParams,
  PRICE_SETTING_TABLE_HEADERS,
  type PriceSettingTableFilters,
} from '@/components/price-settings/price-setting-table-filters'
import { PriceSettingTableFiltersRow } from '@/components/price-settings/price-setting-table-filters-row'
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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { pageTitle } from '@/config/seo'
import { DEFAULT_MARKUP_PERCENT } from '@/config/pricing'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  useDeletePriceSettingMutation,
  useGetPriceSettingsQuery,
  useSetPriceSettingStatusMutation,
} from '@/store/api/price-settings.api'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'
import {
  getPriceSettingTargetLabel,
  getPriceSettingValueLabel,
  PRICE_SETTING_TYPE_LABELS,
  type PriceSettingRecord,
} from '@/types/price-setting.types'

const PRICE_SETTINGS_LIST_PATH = '/sozlamalar/narx'
const PRICE_SETTING_CREATE_PATH = '/sozlamalar/narx/yaratish'

function PriceSettingActiveSwitch({
  setting,
  disabled,
  onToggle,
}: {
  setting: PriceSettingRecord
  disabled?: boolean
  onToggle: (isActive: boolean) => void
}) {
  const label = getPriceSettingTargetLabel(setting)

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`price-setting-active-${setting.id}`}
        checked={setting.isActive}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={
          setting.isActive
            ? `${label} narx sozlamasini nofaol qilish`
            : `${label} narx sozlamasini faol qilish`
        }
      />
      <Label
        htmlFor={`price-setting-active-${setting.id}`}
        className={cn(
          'cursor-pointer text-xs font-medium',
          setting.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {setting.isActive ? 'Faol' : 'Nofaol'}
      </Label>
    </div>
  )
}

export function PriceSettingsPage() {
  const { filterWarehouses } = useUserWarehouseAccess()
  const [filters, setFilters] = useState<PriceSettingTableFilters>(
    emptyPriceSettingTableFilters,
  )
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => priceSettingFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const priceSettingsQuery = useGetPriceSettingsQuery({
    ...filterQuery,
    page,
    perPage,
  })
  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })

  const [setPriceSettingStatus] = useSetPriceSettingStatusMutation()
  const [deletePriceSetting] = useDeletePriceSettingMutation()

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(priceSettingsQuery)

  usePageMeta({
    title: pageTitle('Narx sozlamalari', 'Sozlamalar'),
  })

  const priceSettings = priceSettingsQuery.data?.data ?? []
  const paginationMeta = priceSettingsQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }
  const warehouses = filterWarehouses(warehousesQuery.data?.data ?? [])

  useEffect(() => {
    if (!priceSettingsQuery.error) return
    notify.error(
      getApiErrorMessage(priceSettingsQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [priceSettingsQuery.error])

  function handleFilterChange(patch: Partial<PriceSettingTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  async function handleToggleActive(
    setting: PriceSettingRecord,
    isActive: boolean,
  ) {
    setTogglingId(setting.id)
    try {
      await setPriceSettingStatus({ id: setting.id, isActive }).unwrap()
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Holatni o\'zgartirish amalga oshmadi'),
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(setting: PriceSettingRecord) {
    setDeletingId(setting.id)
    try {
      await deletePriceSetting(setting.id).unwrap()
      notify.success("Narx sozlamasi o'chirildi")
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, "Narx sozlamasini o'chirib bo'lmadi"),
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
            Narx sozlamalari
          </h1>
        </div>
        <Button asChild>
          <Link to={PRICE_SETTING_CREATE_PATH}>
            <AppIcon name="plus" />
            Yangi sozlama
          </Link>
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="settings" />
            Narx sozlamalari ro&apos;yxati
            <Badge variant="secondary">{paginationMeta.total}</Badge>
          </CardTitle>
          <CardDescription>
            Sozlamada ko&apos;rsatilmagan tavarlar avtomatik {DEFAULT_MARKUP_PERCENT}%
            foyda bilan sotiladi. Bu yerda foizni oshirish yoki kamaytirish mumkin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
            {showTableSkeleton ? (
              <DataTableSkeleton
                columns={PRICE_SETTING_TABLE_HEADERS.length}
                rows={6}
                headers={[...PRICE_SETTING_TABLE_HEADERS]}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {PRICE_SETTING_TABLE_HEADERS.map((header) => (
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
                  <PriceSettingTableFiltersRow
                    filters={filters}
                    warehouses={warehouses}
                    disabled={showTableRefreshing}
                    onChange={handleFilterChange}
                  />
                </TableHeader>
                <TableBody>
                  {priceSettings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={PRICE_SETTING_TABLE_HEADERS.length}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Narx sozlamalari topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    priceSettings.map((setting, index) => {
                      const rowNumber =
                        (paginationMeta.page - 1) * paginationMeta.perPage +
                        index +
                        1
                      const valueLabel = getPriceSettingValueLabel(setting)
                      const displayValue =
                        setting.mode === 'fixed'
                          ? formatMoney(setting.fixedPrice ?? 0)
                          : valueLabel

                      return (
                        <TableRow
                          key={setting.id}
                          className={cn(!setting.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[88px] truncate font-mono text-xs">
                            {setting.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            {PRICE_SETTING_TYPE_LABELS[setting.settingType]}
                          </TableCell>
                          <TableCell>{setting.warehouse.name}</TableCell>
                          <TableCell className="max-w-[220px] font-medium">
                            <span className="line-clamp-2">
                              {getPriceSettingTargetLabel(setting)}
                            </span>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {displayValue}
                          </TableCell>
                          <TableCell>
                            <PriceSettingActiveSwitch
                              setting={setting}
                              disabled={togglingId === setting.id}
                              onToggle={(isActive) =>
                                handleToggleActive(setting, isActive)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {formatDateDisplay(setting.createdAt) || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  to={`${PRICE_SETTINGS_LIST_PATH}/${setting.id}/tahrirlash`}
                                  aria-label="Tahrirlash"
                                >
                                  <AppIcon name="pencil" />
                                </Link>
                              </Button>
                              <PriceSettingDeleteButton
                                label={getPriceSettingTargetLabel(setting)}
                                isDeleting={deletingId === setting.id}
                                onConfirmDelete={() => handleDelete(setting)}
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
    </div>
  )
}
