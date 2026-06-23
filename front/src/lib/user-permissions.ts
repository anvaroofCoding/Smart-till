import { sidebarMenu } from '@/config/sidebar-menu'
import type { AuthUser } from '@/types/api.types'

export function getAllPageUrls(): string[] {
  return sidebarMenu.flatMap((section) => section.items.map((item) => item.url))
}

const ADMIN_ONLY_PREFIXES = ['/sozlamalar/foydalanuvchilar']

function isAdminOnlyPath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

export function canAccessPage(
  user: AuthUser | null | undefined,
  path: string,
): boolean {
  if (!user) return false

  const normalized = path.startsWith('/') ? path : `/${path}`

  if (isAdminOnlyPath(normalized) && user.role !== 'admin') {
    return false
  }

  if (user.role === 'admin') return true

  return user.allowedPages.includes(normalized)
}

export function filterSidebarForUser(user: AuthUser | null | undefined) {
  if (!user) return []
  if (user.role === 'admin') return sidebarMenu

  return sidebarMenu
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => user.allowedPages.includes(item.url)),
    }))
    .filter((section) => section.items.length > 0)
}

export function getDefaultLandingPath(user: AuthUser | null | undefined): string {
  if (!user) return '/login'
  if (user.role === 'admin') return '/kassir/buyurtmalar'

  const firstAllowed = user.allowedPages[0]
  if (firstAllowed) return firstAllowed

  return '/sozlamalar/dastur'
}
