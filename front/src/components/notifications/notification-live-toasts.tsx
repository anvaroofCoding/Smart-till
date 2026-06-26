import { useCallback, useEffect, useRef, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { getNotificationPresentation } from '@/components/notifications/notification-presentation'
import { Button } from '@/components/ui/button'
import { useNotificationsEnabled } from '@/features/appearance/appearance-context'
import { useAuth } from '@/hooks/use-auth'
import { useNotificationNavigation } from '@/hooks/use-notification-navigation'
import { resolveNotificationRoute } from '@/lib/notification-navigation'
import { cn } from '@/lib/utils'
import { useSocketContext } from '@/socket/socket-provider'
import { SOCKET_EVENTS } from '@/types/socket.types'
import type { NotificationCreatedPayload } from '@/types/socket.types'
import type { NotificationRecord } from '@/types/notification.types'

const AUTO_CLOSE_MS = 6_000
const MAX_VISIBLE = 3

type LiveNotification = NotificationRecord & { visible: boolean }

function LiveNotificationToast({
  notification,
  onDismiss,
  onOpen,
}: {
  notification: LiveNotification
  onDismiss: (id: string) => void
  onOpen: (notification: NotificationRecord) => void
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const presentation = getNotificationPresentation(notification.type)
  const hasTarget = Boolean(resolveNotificationRoute(notification))

  const scheduleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      onDismiss(notification.id)
    }, AUTO_CLOSE_MS)
  }, [notification.id, onDismiss])

  const clearDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    scheduleDismiss()
    return clearDismissTimer
  }, [scheduleDismiss, clearDismissTimer])

  function handleMouseEnter() {
    clearDismissTimer()
  }

  function handleMouseLeave() {
    scheduleDismiss()
  }

  function handleOpen() {
    clearDismissTimer()
    onDismiss(notification.id)
    void onOpen(notification)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'pointer-events-auto relative w-full max-w-sm rounded-lg border bg-background p-4 pr-10 shadow-lg transition-all',
        'animate-in slide-in-from-top-2 fade-in duration-200',
        presentation.borderClass,
        !notification.visible && 'animate-out fade-out-0 slide-out-to-top-2 duration-200',
      )}
    >
      <button
        type="button"
        onClick={hasTarget ? handleOpen : undefined}
        disabled={!hasTarget}
        className={cn(
          'flex w-full gap-3 text-left',
          hasTarget && 'cursor-pointer',
        )}
      >
        <div
          className={cn(
            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted',
            presentation.iconClass,
          )}
        >
          <AppIcon name={presentation.icon} className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn('text-[11px] font-medium uppercase tracking-wide', presentation.accentClass)}>
            {presentation.label}
          </p>
          <p className="text-sm font-semibold leading-tight">{notification.title}</p>
          <p className="text-muted-foreground text-sm leading-snug">{notification.message}</p>
        </div>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-7"
        aria-label="Bildirishnomani yopish"
        onClick={() => onDismiss(notification.id)}
      >
        <AppIcon name="x" className="size-4" />
      </Button>
    </div>
  )
}

function mapSocketNotification(
  item: NonNullable<NotificationCreatedPayload['items']>[number]['notification'],
): NotificationRecord {
  return {
    id: item.id,
    type: item.type as NotificationRecord['type'],
    title: item.title,
    message: item.message,
    entityType: item.entityType,
    entityId: item.entityId,
    metadata: item.metadata,
    readAt: item.readAt,
    createdAt:
      typeof item.createdAt === 'string'
        ? item.createdAt
        : new Date(item.createdAt).toISOString(),
  }
}

function resolveNotificationForUser(
  payload: NotificationCreatedPayload,
  userId: string,
): NotificationRecord | null {
  if (!payload.userIds.includes(userId)) {
    return null
  }

  const ownItem = payload.items?.find((item) => item.userId === userId)
  if (!ownItem) {
    return null
  }

  return mapSocketNotification(ownItem.notification)
}

export function NotificationLiveToasts() {
  const notificationsEnabled = useNotificationsEnabled()
  const { user } = useAuth()
  const { socket } = useSocketContext()
  const { openNotification } = useNotificationNavigation()
  const [items, setItems] = useState<LiveNotification[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visible: false } : item)),
    )

    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }, 200)
  }, [])

  useEffect(() => {
    if (!notificationsEnabled || !user?.id) return

    const handleCreated = (payload: NotificationCreatedPayload) => {
      const notification = resolveNotificationForUser(payload, user.id)
      if (!notification) return

      setItems((prev) => {
        if (prev.some((item) => item.id === notification.id)) {
          return prev
        }

        return [
          { ...notification, visible: true },
          ...prev.filter((item) => item.id !== notification.id),
        ].slice(0, MAX_VISIBLE)
      })
    }

    socket.on(SOCKET_EVENTS.NOTIFICATION_CREATED, handleCreated)
    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_CREATED, handleCreated)
    }
  }, [notificationsEnabled, socket, user?.id])

  if (!notificationsEnabled || items.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(100vw-2rem,24rem)] flex-col gap-2">
      {items.map((notification) => (
        <div key={notification.id} className="relative">
          <LiveNotificationToast
            notification={notification}
            onDismiss={dismiss}
            onOpen={openNotification}
          />
        </div>
      ))}
    </div>
  )
}
