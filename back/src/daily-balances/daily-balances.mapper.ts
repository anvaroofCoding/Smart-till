import type { DailyBalanceDocument } from './schemas/daily-balance.schema';
import type { DailyBalanceEntryDocument } from './schemas/daily-balance-entry.schema';
import type { MainBalanceTransferDocument } from './schemas/main-balance.schema';
import type { ExpenseCategoryDocument } from '../expense-categories/schemas/expense-category.schema';
import { calculateDailyBalanceTotals, roundMoney } from './utils/daily-balance.utils';
import type {
  DailyBalanceDetailResponseDto,
  DailyBalanceEntryResponseDto,
  DailyBalanceResponseDto,
  ExpenseCategoryResponseDto,
  MainBalanceTransferResponseDto,
} from './dto/daily-balance.dto';

type PopulatedWarehouse =
  | { _id: { toString(): string }; name: string }
  | { toString(): string };

function resolveWarehouseName(
  warehouse: PopulatedWarehouse | undefined,
  fallback = '',
): { id: string; name: string } {
  if (warehouse && typeof warehouse === 'object' && 'name' in warehouse) {
    return {
      id: warehouse._id.toString(),
      name: warehouse.name,
    };
  }

  const id = warehouse?.toString() ?? '';
  return { id, name: fallback };
}

export function toDailyBalanceResponse(
  balance: DailyBalanceDocument,
  warehouseName = '',
): DailyBalanceResponseDto {
  const warehouse = resolveWarehouseName(
    balance.warehouseId as PopulatedWarehouse,
    warehouseName,
  );
  const totals = calculateDailyBalanceTotals(balance);

  return {
    id: balance._id.toString(),
    dateKey: balance.dateKey,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    status: balance.status,
    totals,
    transferredToMain: balance.transferredToMain,
    closedAt: balance.closedAt,
    createdAt: (balance as DailyBalanceDocument & { createdAt: Date }).createdAt,
    updatedAt: (balance as DailyBalanceDocument & { updatedAt: Date }).updatedAt,
  };
}

export function toDailyBalanceEntryResponse(
  entry: DailyBalanceEntryDocument,
): DailyBalanceEntryResponseDto {
  return {
    id: entry._id.toString(),
    type: entry.type,
    channel: entry.channel,
    amount: entry.amount,
    note: entry.note ?? '',
    expenseCategoryId: entry.expenseCategoryId?.toString(),
    expenseCategoryName: entry.expenseCategoryName ?? '',
    orderId: entry.orderId?.toString(),
    orderLabel: entry.orderLabel ?? '',
    createdAt: (entry as DailyBalanceEntryDocument & { createdAt: Date })
      .createdAt,
  };
}

export function toDailyBalanceDetailResponse(
  balance: DailyBalanceDocument,
  entries: DailyBalanceEntryDocument[],
  warehouseName = '',
): DailyBalanceDetailResponseDto {
  const base = toDailyBalanceResponse(balance, warehouseName);
  const incomes = entries
    .filter((entry) => entry.type === 'sale' || entry.type === 'manual_income')
    .map(toDailyBalanceEntryResponse);
  const expenses = entries
    .filter((entry) => entry.type === 'expense')
    .map(toDailyBalanceEntryResponse);
  const mainDeposits = entries
    .filter((entry) => entry.type === 'cash_to_main')
    .map(toDailyBalanceEntryResponse);

  const todayCashTotal = roundMoney(
    balance.salesCash + balance.manualIncomeCash,
  );
  const availableCashForDeposit = Math.max(
    0,
    roundMoney(todayCashTotal - balance.transferredToMain),
  );

  return {
    ...base,
    incomes,
    expenses,
    mainDeposits,
    todayCashTotal,
    availableCashForDeposit,
  };
}

export function toMainBalanceTransferResponse(
  transfer: MainBalanceTransferDocument,
  warehouseName = '',
): MainBalanceTransferResponseDto {
  const warehouse = resolveWarehouseName(
    transfer.warehouseId as PopulatedWarehouse,
    warehouseName,
  );

  return {
    id: transfer._id.toString(),
    dailyBalanceId: transfer.dailyBalanceId.toString(),
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    dateKey: transfer.dateKey,
    amount: transfer.amount,
    mainBalanceBefore: transfer.mainBalanceBefore,
    mainBalanceAfter: transfer.mainBalanceAfter,
    createdAt: (transfer as MainBalanceTransferDocument & { createdAt: Date })
      .createdAt,
  };
}

export function toExpenseCategoryResponse(
  category: ExpenseCategoryDocument,
  usageCount = 0,
): ExpenseCategoryResponseDto {
  return {
    id: category._id.toString(),
    name: category.name,
    parentId: category.parentId?.toString(),
    isActive: category.isActive,
    usageCount,
  };
}

export function toExpenseCategoryGroupResponse(
  parent: ExpenseCategoryDocument,
  children: ExpenseCategoryResponseDto[],
) {
  return {
    id: parent._id.toString(),
    name: parent.name,
    childrenCount: children.length,
    children,
  };
}
