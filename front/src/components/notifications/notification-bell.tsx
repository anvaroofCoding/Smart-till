import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { uz } from 'date-fns/locale/uz'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useNotificationsEnabled } from '@/features/appearance/appearance-context'
import { cn } from '@/lib/utils'
import {
  useGetNotificationUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/api/notifications.api'
import type { NotificationRecord } from '@/types/notification.types'

function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: uz,
  })
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: NotificationRecord
  onRead: (id: string) => void
}) {
  const isUnread = !notification.readAt

  return (
    <button
      type="button"
      onClick={() => {
        if (isUnread) {
          onRead(notification.id)
        }
      }}
      className={cn(
        'flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/70',
        isUnread && 'bg-muted/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">
          {notification.title}
        </span>
        {isUnread ? (
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{notification.message}</p>
      <span className="text-[11px] text-muted-foreground">
        {formatNotificationTime(notification.createdAt)}
      </span>
    </button>
  )
}

export function NotificationBell() {
  const notificationsEnabled = useNotificationsEnabled()
  const [open, setOpen] = useState(false)

  const { data: unreadData } = useGetNotificationUnreadCountQuery(undefined, {
    skip: !notificationsEnabled,
    pollingInterval: notificationsEnabled ? 60_000 : undefined,
  })
  const { data: notificationsData, isFetching } = useGetNotificationsQuery(
    { page: 1, perPage: 20 },
    { skip: !notificationsEnabled || !open },
  )
  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation()

  const unreadCount = unreadData?.count ?? 0
  const notifications = notificationsData?.data ?? []

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
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium leading-4 text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
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
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Yuklanmoqda...
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Bildirishnomalar yo&apos;q
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={(id) => void markRead(id)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
