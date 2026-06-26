import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { resolveNotificationRoute } from '@/lib/notification-navigation'
import { useMarkNotificationReadMutation } from '@/store/api/notifications.api'
import type { NotificationRecord } from '@/types/notification.types'

export function useNotificationNavigation() {
  const navigate = useNavigate()
  const [markRead] = useMarkNotificationReadMutation()

  const openNotification = useCallback(
    async (notification: NotificationRecord) => {
      const route = resolveNotificationRoute(notification)

      if (!notification.readAt) {
        try {
          await markRead(notification.id).unwrap()
        } catch {
          // Navigation should still work if mark-read fails.
        }
      }

      if (route) {
        navigate(route)
      }
    },
    [markRead, navigate],
  )

  return { openNotification, resolveNotificationRoute }
}
