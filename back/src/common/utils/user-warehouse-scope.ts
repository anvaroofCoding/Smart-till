import { Types } from 'mongoose';
import { UserPosition } from '../constants/positions';

export interface UserWarehouseScope {
  allWarehouses: boolean;
  warehouseIds: Types.ObjectId[];
}

export function normalizeWarehouseId(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return Types.ObjectId.isValid(trimmed) ? trimmed : null;
  }

  if (typeof value === 'object') {
    if ('_id' in value) {
      return normalizeWarehouseId((value as { _id: unknown })._id);
    }

    if (typeof (value as { toString?: () => string }).toString === 'function') {
      const asString = (value as { toString: () => string }).toString();
      if (asString !== '[object Object]' && Types.ObjectId.isValid(asString)) {
        return asString;
      }
    }
  }

  return null;
}

export function normalizeScopeWarehouseIds(
  ids?: unknown[],
): Types.ObjectId[] {
  const normalized = (ids ?? [])
    .map((id) => normalizeWarehouseId(id))
    .filter((id): id is string => Boolean(id));

  return [...new Set(normalized)].map((id) => new Types.ObjectId(id));
}

export function resolveUserWarehouseScope(user: {
  position: UserPosition;
  allWarehouses?: boolean;
  warehouseIds?: unknown[];
}): UserWarehouseScope {
  if (user.position === UserPosition.ADMIN || user.allWarehouses) {
    return { allWarehouses: true, warehouseIds: [] };
  }

  return {
    allWarehouses: false,
    warehouseIds: normalizeScopeWarehouseIds(user.warehouseIds),
  };
}

export function isWarehouseAllowed(
  scope: UserWarehouseScope | undefined,
  warehouseId: unknown,
): boolean {
  if (!scope || scope.allWarehouses) {
    return true;
  }

  const targetId = normalizeWarehouseId(warehouseId);
  if (!targetId || scope.warehouseIds.length === 0) {
    return false;
  }

  return scope.warehouseIds.some(
    (id) => normalizeWarehouseId(id) === targetId,
  );
}

export function assertWarehouseAccess(
  scope: UserWarehouseScope,
  warehouseId: unknown,
): void {
  if (!isWarehouseAllowed(scope, warehouseId)) {
    throw new Error('WAREHOUSE_FORBIDDEN');
  }
}

export function emptyPaginatedMeta(page: number, perPage: number) {
  return {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  };
}
