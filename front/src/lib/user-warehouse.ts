import type { AuthUser } from '@/types/api.types'
import type { UserRecord } from '@/types/user.types'

type WarehouseUser = Pick<
  UserRecord | AuthUser,
  'position' | 'allWarehouses' | 'warehouseIds' | 'warehouses'
>

export function userHasAllWarehouses(user?: WarehouseUser | null): boolean {
  if (!user) return false
  return user.position === 'admin' || user.allWarehouses
}

export function getUserWarehouseLabel(user?: WarehouseUser | null): string {
  if (!user) return '—'
  if (userHasAllWarehouses(user)) return 'Barcha omborlar'

  const names = user.warehouses?.map((warehouse) => warehouse.name) ?? []
  if (names.length > 0) return names.join(', ')

  if (user.warehouseIds.length === 1) return '1 ta ombor'
  return `${user.warehouseIds.length} ta ombor`
}

export function canAccessWarehouse(
  user: WarehouseUser | null | undefined,
  warehouseId: string,
): boolean {
  if (!user) return false
  if (userHasAllWarehouses(user)) return true
  const target = warehouseId.trim()
  return user.warehouseIds.some((id) => id.trim() === target)
}

export function filterWarehousesForUser<T extends { id: string }>(
  items: T[],
  user?: WarehouseUser | null,
): T[] {
  if (!user) return []
  if (userHasAllWarehouses(user)) return items
  const allowed = new Set(user.warehouseIds)
  return items.filter((item) => allowed.has(item.id))
}
