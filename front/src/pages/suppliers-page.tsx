import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
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
import { SUPPLIER_CURRENCY_LABELS } from '@/lib/currency'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  useGetSuppliersQuery,
  useSetSupplierStatusMutation,
} from '@/store/api/suppliers.api'
import type { SupplierRecord } from '@/types/supplier.types'

const SUPPLIERS_LIST_PATH = '/yetkazib-beruvchilar/ro-yxat'
const SUPPLIER_CREATE_PATH = '/yetkazib-beruvchilar/ro-yxat/yaratish'

const TABLE_HEADERS = [
  '№',
  'Nomi',
  'Rasmiy nomi',
  'Telefon',
  'Valyuta',
  'Holat',
  'Amallar',
]

function SupplierActiveSwitch({
  supplier,
  disabled,
  onToggle,
}: {
  supplier: SupplierRecord
  disabled?: boolean
  onToggle: (isActive: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`supplier-active-${supplier.id}`}
        checked={supplier.isActive}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={
          supplier.isActive
            ? `${supplier.name} yetkazib beruvchisini nofaol qilish`
            : `${supplier.name} yetkazib beruvchisini faol qilish`
        }
      />
      <Label
        htmlFor={`supplier-active-${supplier.id}`}
        className={cn(
          'cursor-pointer text-xs font-medium',
          supplier.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {supplier.isActive ? 'Faol' : 'Nofaol'}
      </Label>
    </div>
  )
}

export function SuppliersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { page, perPage, setPage, setPerPage } = useListPagination(search)

  const suppliersQuery = useGetSuppliersQuery({
    search: search.trim() || undefined,
    page,
    perPage,
  })

  const [setSupplierStatus] = useSetSupplierStatusMutation()

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(suppliersQuery)

  usePageMeta({
    title: pageTitle('Yetkazib beruvchilar', 'Yetkazib beruvchilar'),
  })

  const suppliers = suppliersQuery.data?.data ?? []
  const paginationMeta = suppliersQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  useEffect(() => {
    if (!suppliersQuery.error) return
    notify.error(
      getApiErrorMessage(suppliersQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [suppliersQuery.error])

  async function handleToggleActive(supplier: SupplierRecord, isActive: boolean) {
    setTogglingId(supplier.id)
    try {
      await setSupplierStatus({ id: supplier.id, isActive }).unwrap()
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Yetkazib beruvchilar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Qator ustiga bosib batafsil ma&apos;lumotlarni ko&apos;rishingiz
            mumkin.
          </p>
        </div>
        <Button asChild>
          <Link to={SUPPLIER_CREATE_PATH}>
            <AppIcon name="plus" />
            Yangi yetkazib beruvchi
          </Link>
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="truck" />
            Yetkazib beruvchilar ro&apos;yxati
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
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Yetkazib beruvchilar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier, index) => {
                      const page = suppliersQuery.data?.meta.page ?? 1
                      const perPage = suppliersQuery.data?.meta.perPage ?? 20
                      const rowNumber = (page - 1) * perPage + index + 1

                      const detailPath = `${SUPPLIERS_LIST_PATH}/${supplier.id}`

                      return (
                        <TableRow
                          key={supplier.id}
                          className={cn(
                            'cursor-pointer',
                            !supplier.isActive && 'opacity-60',
                          )}
                          onClick={() => navigate(detailPath)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              navigate(detailPath)
                            }
                          }}
                          tabIndex={0}
                          role="link"
                          aria-label={`${supplier.name} — batafsil ko'rish`}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {supplier.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {supplier.officialName || '—'}
                          </TableCell>
                          <TableCell>{supplier.phone || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {SUPPLIER_CURRENCY_LABELS[supplier.currency]}
                            </Badge>
                          </TableCell>
                          <TableCell
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <SupplierActiveSwitch
                              supplier={supplier}
                              disabled={togglingId === supplier.id}
                              onToggle={(isActive) =>
                                handleToggleActive(supplier, isActive)
                              }
                            />
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                to={`${SUPPLIERS_LIST_PATH}/${supplier.id}/tahrirlash`}
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
