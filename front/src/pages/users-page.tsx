import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
  StatsCardsSkeleton,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQueryLoading, useQueriesLoading } from '@/hooks/use-query-loading'
import { useListPagination } from '@/hooks/use-list-pagination'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { getUserWarehouseLabel } from '@/lib/user-warehouse'
import { formatDateDisplay } from '@/lib/date-format'
import { cn } from '@/lib/utils'
import {
  useGetUsersQuery,
  useGetUsersStatsQuery,
  useSetUserStatusMutation,
} from '@/store/api/users.api'
import { POSITION_LABELS, type UserRecord } from '@/types/user.types'

const CREATE_USER_PATH = '/sozlamalar/foydalanuvchilar/yaratish'

const TABLE_HEADERS = [
  '№',
  'F.I.Sh',
  'Login',
  'Telefon',
  "Tug'ilgan sana",
  'Lavozim',
  'Holat',
  'Ombor',
  'Ruxsatlar',
  'Amallar',
]

function formatDate(value?: string) {
  if (!value) return '—'
  return formatDateDisplay(value) || '—'
}

function UserActiveSwitch({
  user,
  disabled,
  onToggle,
}: {
  user: UserRecord
  disabled?: boolean
  onToggle: (isActive: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`active-${user.id}`}
        checked={user.isActive}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={
          user.isActive
            ? `${user.login} foydalanuvchini nofaol qilish`
            : `${user.login} foydalanuvchini faol qilish`
        }
      />
      <Label
        htmlFor={`active-${user.id}`}
        className={cn(
          'cursor-pointer text-xs font-medium',
          user.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {user.isActive ? 'Faol' : 'Nofaol'}
      </Label>
    </div>
  )
}

export function UsersPage() {
  const [search, setSearch] = useState('')
  const { page, perPage, setPage, setPerPage } = useListPagination(search)

  const usersQuery = useGetUsersQuery({
    search: search.trim() || undefined,
    page,
    perPage,
  })

  const statsQuery = useGetUsersStatsQuery()
  const [setUserStatus] = useSetUserStatusMutation()
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(usersQuery)
  const { showSkeleton: showStatsSkeleton } = useQueryLoading(statsQuery)
  const { showSkeleton: showPageSkeleton } = useQueriesLoading([
    usersQuery,
    statsQuery,
  ])

  const users = usersQuery.data?.data ?? []
  const stats = statsQuery.data
  const paginationMeta = usersQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  useEffect(() => {
    if (!usersQuery.error) return
    notify.error(
      getApiErrorMessage(usersQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [usersQuery.error])

  async function handleToggleActive(user: UserRecord, isActive: boolean) {
    setTogglingUserId(user.id)
    try {
      await setUserStatus({ id: user.id, isActive }).unwrap()
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Holatni o\'zgartirish amalga oshmadi'),
      )
    } finally {
      setTogglingUserId(null)
    }
  }

  const statCards = [
    {
      title: 'Jami foydalanuvchilar',
      value: stats?.total ?? 0,
    },
    {
      title: 'Profilega kirishlik darajasi',
      value: stats ? `${stats.profileAccessLevel}%` : '0%',
    },
    {
      title: 'Faol xodimlar',
      value: stats?.active ?? 0,
    },
    {
      title: 'Nofaol xodimlar',
      value: stats?.inactive ?? 0,
    },
  ]

  if (showPageSkeleton) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col gap-4">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Foydalanuvchilar</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Foydalanuvchilarni yaratish, tahrirlash va istalgan vaqtda faol yoki nofaol
              qilish. Nofaol foydalanuvchi tizimga kira olmaydi.
            </p>
          </div>
          <Button asChild>
            <Link to={CREATE_USER_PATH}>
              <AppIcon name="plus" />
              Yangi foydalanuvchi
            </Link>
          </Button>
        </div>

        <StatsCardsSkeleton />

        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <AppIcon name="users" />
              Foydalanuvchilar ro&apos;yxati
            </CardTitle>
            <CardDescription>
              Login, telefon, lavozim va ruxsat etilgan sahifalar
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden">
            <DataTableSkeleton
              columns={9}
              rows={6}
              headers={TABLE_HEADERS}
              showToolbar
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Foydalanuvchilar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Foydalanuvchilarni yaratish, tahrirlash va istalgan vaqtda faol yoki nofaol
            qilish. Nofaol foydalanuvchi tizimga kira olmaydi.
          </p>
        </div>
        <Button asChild>
          <Link to={CREATE_USER_PATH}>
            <AppIcon name="plus" />
            Yangi foydalanuvchi
          </Link>
        </Button>
      </div>

      <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl">
                {showStatsSkeleton ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  card.value
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="users" />
            Foydalanuvchilar ro&apos;yxati
          </CardTitle>
          <CardDescription>
            Login, telefon, lavozim va ruxsat etilgan sahifalar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="relative w-full max-w-md shrink-0">
            <AppIcon name="search" className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" />
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
                columns={10}
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
                        className={header === '№' ? 'w-12 text-center' : header === 'Amallar' ? 'text-right' : undefined}
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-muted-foreground h-24 text-center">
                        Foydalanuvchilar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, index) => {
                      const page = usersQuery.data?.meta.page ?? 1
                      const perPage = usersQuery.data?.meta.perPage ?? 50
                      const rowNumber = (page - 1) * perPage + index + 1

                      return (
                        <TableRow
                          key={user.id}
                          className={cn(!user.isActive && 'opacity-60')}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.login}</TableCell>
                          <TableCell>{user.phone || '—'}</TableCell>
                          <TableCell>{formatDate(user.birthDate)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {POSITION_LABELS[user.position]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <UserActiveSwitch
                              user={user}
                              disabled={togglingUserId === user.id}
                              onToggle={(isActive) =>
                                handleToggleActive(user, isActive)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {getUserWarehouseLabel(user)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.position === 'admin' ? (
                              <Badge>Barcha sahifalar</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {user.allowedPages.length} ta sahifa
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                to={`/sozlamalar/foydalanuvchilar/${user.id}/tahrirlash`}
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
