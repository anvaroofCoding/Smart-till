import { useCallback, useEffect, useRef, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import { useNotificationsEnabled } from '@/features/appearance/appearance-context'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useSocketContext } from '@/socket/socket-provider'
import { SOCKET_EVENTS } from '@/types/socket.types'
import type { NotificationCreatedPayload } from '@/types/socket.types'
import type { NotificationRecord } from '@/types/notification.types'

const AUTO_CLOSE_MS = 3000
const MAX_VISIBLE = 3

type LiveNotification = NotificationRecord & { visible: boolean }

function LiveNotificationToast({
  notification,
  onDismiss,
}: {
  notification: LiveNotification
  onDismiss: (id: string) => void
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <div
      role="status"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'pointer-events-auto relative w-full max-w-sm rounded-lg border bg-background p-4 pr-10 shadow-lg transition-all',
        'animate-in slide-in-from-top-2 fade-in duration-200',
        !notification.visible && 'animate-out fade-out-0 slide-out-to-top-2 duration-200',
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold leading-tight">{notification.title}</p>
        <p className="text-muted-foreground text-sm">{notification.message}</p>
      </div>
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

export function NotificationLiveToasts() {
  const notificationsEnabled = useNotificationsEnabled()
  const { user } = useAuth()
  const { socket } = useSocketContext()
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
    if (!notificationsEnabled || !user) return

    const handleCreated = (payload: NotificationCreatedPayload) => {
      if (!payload.userIds.includes(user.id)) return

      const ownItem = payload.items?.find((item) => item.userId === user.id)
      if (!ownItem) return

      const notification = mapSocketNotification(ownItem.notification)

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
  }, [notificationsEnabled, socket, user])

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
          />
        </div>
      ))}
    </div>
  )
}
