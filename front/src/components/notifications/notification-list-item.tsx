import { formatDistanceToNow } from 'date-fns'
import { uz } from 'date-fns/locale/uz'

import { AppIcon } from '@/components/icons/app-icon'
import { getNotificationPresentation } from '@/components/notifications/notification-presentation'
import { Badge } from '@/components/ui/badge'
import { resolveNotificationRoute } from '@/lib/notification-navigation'
import { cn } from '@/lib/utils'
import type { NotificationRecord } from '@/types/notification.types'

function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: uz,
  })
}

interface NotificationListItemProps {
  notification: NotificationRecord
  onOpen: (notification: NotificationRecord) => void
  compact?: boolean
}

export function NotificationListItem({
  notification,
  onOpen,
  compact = false,
}: NotificationListItemProps) {
  const isUnread = !notification.readAt
  const presentation = getNotificationPresentation(notification.type)
  const hasTarget = Boolean(resolveNotificationRoute(notification))

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        'flex w-full gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/70',
        isUnread && 'bg-muted/40',
        !hasTarget && 'cursor-default',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-muted',
          presentation.iconClass,
          compact ? 'size-8' : 'size-9',
        )}
      >
        <AppIcon name={presentation.icon} className={compact ? 'size-4' : 'size-5'} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p
              className={cn(
                'text-[11px] font-medium uppercase tracking-wide',
                presentation.accentClass,
              )}
            >
              {presentation.label}
            </p>
            <p className="text-sm font-medium leading-tight">{notification.title}</p>
          </div>
          {isUnread ? (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
          ) : null}
        </div>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">
          {notification.message}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-[11px]">
            {formatNotificationTime(notification.createdAt)}
          </span>
          {isUnread ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              Yangi
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  )
}
