import { useEffect } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { NotificationListItem } from '@/components/notifications/notification-list-item'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { LIST_PAGE_TABLE_SECTION_CLASS } from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import { useNotificationsEnabled } from '@/features/appearance/appearance-context'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useNotificationNavigation } from '@/hooks/use-notification-navigation'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
} from '@/store/api/notifications.api'

export function NotificationsPage() {
  const notificationsEnabled = useNotificationsEnabled()
  const { page, perPage, setPage, setPerPage } = useListPagination('notifications')
  const { openNotification } = useNotificationNavigation()
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation()

  const notificationsQuery = useGetNotificationsQuery(
    { page, perPage },
    { skip: !notificationsEnabled, refetchOnMountOrArgChange: true },
  )
  const { data: unreadData } = useGetNotificationUnreadCountQuery(undefined, {
    skip: !notificationsEnabled,
  })

  const { showSkeleton, showRefreshing } = useQueryLoading(notificationsQuery)

  usePageMeta({
    title: pageTitle('Bildirishnomalar'),
  })

  const notifications = notificationsQuery.data?.data ?? []
  const paginationMeta = notificationsQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }
  const hasUnread = (unreadData?.count ?? 0) > 0

  useEffect(() => {
    if (!notificationsQuery.error) return
    notify.error(
      getApiErrorMessage(notificationsQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [notificationsQuery.error])

  if (!notificationsEnabled) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AppIcon name="bell-off" className="text-muted-foreground size-10" />
        <div>
          <h1 className="text-lg font-semibold">Bildirishnomalar o&apos;chirilgan</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sozlamalardan bildirishnomalarni yoqing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bildirishnomalar</h1>
        </div>
        {hasUnread ? (
          <Button
            variant="outline"
            disabled={markAllState.isLoading}
            onClick={() => void markAllRead()}
          >
            Barchasini o&apos;qilgan
          </Button>
        ) : null}
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <QueryRefreshIndicator visible={showRefreshing} />
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {showSkeleton ? (
            <DataTableSkeleton columns={1} rows={8} />
          ) : notifications.length === 0 ? (
            <div className="text-muted-foreground flex h-40 flex-col items-center justify-center gap-2 text-sm">
              <AppIcon name="bell" className="size-8 opacity-40" />
              Bildirishnomalar yo&apos;q
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {notifications.map((notification) => (
                <NotificationListItem
                  key={notification.id}
                  notification={notification}
                  onOpen={(item) => void openNotification(item)}
                />
              ))}
            </div>
          )}
        </div>

        {!showSkeleton && (
          <DataTablePagination
            meta={paginationMeta}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            disabled={showRefreshing}
          />
        )}
      </div>
    </div>
  )
}
