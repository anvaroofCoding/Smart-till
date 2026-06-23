import type { SidebarMenuItem } from '@/config/sidebar-menu'
import { getDefaultSidebarMenu, getSidebarSectionUrls } from '@/config/sidebar-menu'

const STORAGE_KEY = 'smart-till-sidebar-menu-order'

export function loadSidebarMenuOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveSidebarMenuOrder(order: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
}

export function applySidebarMenuOrder(
  menu: SidebarMenuItem[],
  order: string[] | null,
): SidebarMenuItem[] {
  if (!order?.length) return menu

  const byUrl = new Map(menu.map((section) => [section.url, section]))
  const ordered: SidebarMenuItem[] = []

  for (const url of order) {
    const section = byUrl.get(url)
    if (section) {
      ordered.push(section)
      byUrl.delete(url)
    }
  }

  for (const section of byUrl.values()) {
    ordered.push(section)
  }

  return ordered
}

export function resolveSidebarMenuOrder(
  menu: SidebarMenuItem[] = getDefaultSidebarMenu(),
): string[] {
  const defaultUrls = getSidebarSectionUrls(menu)
  const saved = loadSidebarMenuOrder()

  if (!saved) return defaultUrls

  const known = new Set(defaultUrls)
  const validSaved = saved.filter((url) => known.has(url))
  const missing = defaultUrls.filter((url) => !validSaved.includes(url))

  return [...validSaved, ...missing]
}
