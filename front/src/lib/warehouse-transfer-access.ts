import { canAccessWarehouse } from '@/lib/user-warehouse'
import type { AuthUser } from '@/types/api.types'
import type { WarehouseTransferRecord } from '@/types/warehouse-transfer.types'

type WarehouseUser = Pick<
  AuthUser,
  'position' | 'allWarehouses' | 'warehouseIds'
> | null | undefined

export function isTransferSender(
  user: WarehouseUser,
  transfer: Pick<WarehouseTransferRecord, 'fromWarehouseId'>,
): boolean {
  if (!user) return false
  return canAccessWarehouse(user, transfer.fromWarehouseId)
}

export function isTransferRecipient(
  user: WarehouseUser,
  transfer: Pick<WarehouseTransferRecord, 'toWarehouseId'>,
): boolean {
  if (!user) return false
  if (!transfer.toWarehouseId) return false
  return canAccessWarehouse(user, transfer.toWarehouseId)
}

export function canAcceptTransfer(
  user: WarehouseUser,
  transfer: WarehouseTransferRecord,
): boolean {
  return transfer.status === 'sent' && isTransferRecipient(user, transfer)
}
