import { Outlet } from 'react-router-dom'

import { NotificationLiveToasts } from '@/components/notifications/notification-live-toasts'

export function AppShell() {
  return (
    <>
      <Outlet />
      <NotificationLiveToasts />
    </>
  )
}
