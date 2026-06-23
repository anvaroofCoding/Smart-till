import { useCallback, useMemo, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'

import {
  getDefaultSidebarMenu,
  type SidebarMenuItem,
} from '@/config/sidebar-menu'
import {
  applySidebarMenuOrder,
  resolveSidebarMenuOrder,
  saveSidebarMenuOrder,
} from '@/lib/sidebar-menu-order'

export function useSidebarMenuOrder() {
  const defaultMenu = useMemo(() => getDefaultSidebarMenu(), [])

  const [order, setOrder] = useState<string[]>(() =>
    resolveSidebarMenuOrder(defaultMenu),
  )

  const items = useMemo(
    () => applySidebarMenuOrder(defaultMenu, order),
    [defaultMenu, order],
  )

  const reorderItems = useCallback((activeId: string, overId: string) => {
    setOrder((current) => {
      const oldIndex = current.indexOf(activeId)
      const newIndex = current.indexOf(overId)

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return current
      }

      const next = arrayMove(current, oldIndex, newIndex)
      saveSidebarMenuOrder(next)
      return next
    })
  }, [])

  const resetOrder = useCallback(() => {
    const defaultOrder = resolveSidebarMenuOrder(defaultMenu)
    saveSidebarMenuOrder(defaultOrder)
    setOrder(defaultOrder)
  }, [defaultMenu])

  return {
    items: items as SidebarMenuItem[],
    reorderItems,
    resetOrder,
  }
}
