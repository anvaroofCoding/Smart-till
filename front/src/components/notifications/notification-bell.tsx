import { useState } from 'react'
import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { NotificationListItem } from '@/components/notifications/notification-list-item'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useNotificationsEnabled } from '@/features/appearance/appearance-context'
import { useNotificationNavigation } from '@/hooks/use-notification-navigation'
import {
  useGetNotificationUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
} from '@/store/api/notifications.api'

const NOTIFICATIONS_PAGE_PATH = '/bildirishnomalar'

export function NotificationBell() {
  const notificationsEnabled = useNotificationsEnabled()
  const [open, setOpen] = useState(false)
  const { openNotification } = useNotificationNavigation()

  const { data: unreadData } = useGetNotificationUnreadCountQuery(undefined, {
    skip: !notificationsEnabled,
    pollingInterval: 60_000,
  })
  const { data: notificationsData, isFetching } = useGetNotificationsQuery(
    { page: 1, perPage: 20 },
    { skip: !notificationsEnabled || !open },
  )
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation()

  const unreadCount = unreadData?.count ?? 0
  const notifications = notificationsData?.data ?? []

  async function handleOpenNotification(
    notification: Parameters<typeof openNotification>[0],
  ) {
    setOpen(false)
    await openNotification(notification)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={
            notificationsEnabled
              ? unreadCount > 0
                ? `${unreadCount} ta o'qilmagan bildirishnoma`
                : 'Bildirishnomalar'
              : 'Bildirishnomalar o\'chirilgan'
          }
          disabled={!notificationsEnabled}
          data-enabled={notificationsEnabled || undefined}
        >
          <AppIcon name="bell" className="size-5" />
          {notificationsEnabled && unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex size-5 min-w-5 items-center justify-center rounded-full border-2 border-background p-0 text-[10px] font-semibold leading-none"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Bildirishnomalar</h3>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={markAllState.isLoading}
              onClick={() => void markAllRead()}
            >
              Barchasini o&apos;qilgan
            </Button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {isFetching && notifications.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Yuklanmoqda...
            </p>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Bildirishnomalar yo&apos;q
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {notifications.map((notification) => (
                <NotificationListItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onOpen={(item) => void handleOpenNotification(item)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs"
            asChild
          >
            <Link to={NOTIFICATIONS_PAGE_PATH} onClick={() => setOpen(false)}>
              Barchasini ko&apos;rish
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
