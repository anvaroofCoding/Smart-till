import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { UserWarehouseScope } from '../common/utils/user-warehouse-scope';
import {
  getTodayDateKey,
  roundMoney,
} from '../daily-balances/utils/daily-balance.utils';
import {
  DailyBalance,
  DailyBalanceDocument,
} from '../daily-balances/schemas/daily-balance.schema';
import {
  Warehouse,
  WarehouseDocument,
} from '../warehouses/schemas/warehouse.schema';
import {
  MonthlySalesReportDto,
  SalesReportDto,
  WarehouseSalesSummaryDto,
} from './dto/sales-report.dto';

function getYesterdayDateKey(date = new Date()): string {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - 1);
  return getTodayDateKey(copy);
}

function getCurrentMonthPrefix(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function toMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  if (!year || !month) {
    return monthKey;
  }
  return `${month}-${year}`;
}

function calcSalesTotal(
  salesCash: number,
  salesTerminal: number,
  salesCard: number,
): number {
  return roundMoney(salesCash + salesTerminal + salesCard);
}

function calcPlanPercent(actual: number, plan: number): number {
  if (!plan || plan <= 0) {
    return 0;
  }
  return roundMoney((actual / plan) * 100);
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(DailyBalance.name)
    private readonly dailyBalanceModel: Model<DailyBalanceDocument>,
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
  ) {}

  async getSalesReport(scope?: UserWarehouseScope): Promise<SalesReportDto> {
    const warehouses = await this.getWarehousesInScope(scope);
    const warehouseIds = warehouses.map((warehouse) => warehouse._id);

    if (warehouseIds.length === 0) {
      return { summary: [], monthly: [] };
    }

    const todayKey = getTodayDateKey();
    const yesterdayKey = getYesterdayDateKey();
    const monthPrefix = getCurrentMonthPrefix();

    const [summaryBalances, monthlyRows] = await Promise.all([
      this.dailyBalanceModel
        .find({
          warehouseId: { $in: warehouseIds },
          $or: [
            { dateKey: todayKey },
            { dateKey: yesterdayKey },
            { dateKey: { $regex: `^${monthPrefix}` } },
          ],
        })
        .select('warehouseId dateKey salesCash salesTerminal salesCard')
        .exec(),
      this.dailyBalanceModel
        .aggregate<{
          _id: { monthKey: string; warehouseId: Types.ObjectId };
          total: number;
        }>([
          { $match: { warehouseId: { $in: warehouseIds } } },
          {
            $addFields: {
              salesTotal: {
                $add: ['$salesCash', '$salesTerminal', '$salesCard'],
              },
              monthKey: { $substr: ['$dateKey', 0, 7] },
            },
          },
          {
            $group: {
              _id: { monthKey: '$monthKey', warehouseId: '$warehouseId' },
              total: { $sum: '$salesTotal' },
            },
          },
          { $sort: { '_id.monthKey': -1, '_id.warehouseId': 1 } },
        ])
        .exec(),
    ]);

    const currentMonthSalesByWarehouse = new Map<string, number>();
    for (const row of monthlyRows) {
      if (row._id.monthKey !== monthPrefix) {
        continue;
      }
      currentMonthSalesByWarehouse.set(
        row._id.warehouseId.toString(),
        roundMoney(row.total),
      );
    }

    const summary = warehouses.map((warehouse) => {
      const warehouseId = warehouse._id.toString();
      let todaySales = 0;
      let yesterdaySales = 0;
      let monthSales = 0;

      for (const balance of summaryBalances) {
        if (balance.warehouseId.toString() !== warehouseId) {
          continue;
        }

        const sales = calcSalesTotal(
          balance.salesCash,
          balance.salesTerminal,
          balance.salesCard,
        );

        if (balance.dateKey === todayKey) {
          todaySales += sales;
        } else if (balance.dateKey === yesterdayKey) {
          yesterdaySales += sales;
        }

        if (balance.dateKey.startsWith(monthPrefix)) {
          monthSales += sales;
        }
      }

      const roundedMonthSales = roundMoney(
        currentMonthSalesByWarehouse.get(warehouseId) ?? monthSales,
      );

      return {
        warehouseId,
        warehouseName: warehouse.name,
        todaySales: roundMoney(todaySales),
        yesterdaySales: roundMoney(yesterdaySales),
        monthSales: roundedMonthSales,
        dailySalesPlan: roundMoney(warehouse.dailySalesPlan ?? 0),
        monthPlanPercent: calcPlanPercent(
          roundedMonthSales,
          warehouse.dailySalesPlan ?? 0,
        ),
        todayPlanPercent: calcPlanPercent(
          todaySales,
          warehouse.dailySalesPlan ?? 0,
        ),
        planRemaining: roundMoney(
          (warehouse.dailySalesPlan ?? 0) - todaySales,
        ),
      } satisfies WarehouseSalesSummaryDto;
    });

    const monthlyMap = new Map<string, MonthlySalesReportDto>();

    for (const row of monthlyRows) {
      const monthKey = row._id.monthKey;
      const warehouseId = row._id.warehouseId.toString();
      const sales = roundMoney(row.total);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          monthKey,
          monthLabel: toMonthLabel(monthKey),
          warehouses: warehouses.map((warehouse) => ({
            warehouseId: warehouse._id.toString(),
            warehouseName: warehouse.name,
            sales: 0,
          })),
          total: 0,
        });
      }

      const monthReport = monthlyMap.get(monthKey)!;
      const warehouseRow = monthReport.warehouses.find(
        (item) => item.warehouseId === warehouseId,
      );
      if (warehouseRow) {
        warehouseRow.sales = sales;
      }
      monthReport.total = roundMoney(
        monthReport.warehouses.reduce((sum, item) => sum + item.sales, 0),
      );
    }

    const monthly = [...monthlyMap.values()].sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey),
    );

    for (const monthReport of monthly) {
      monthReport.warehouses.sort((a, b) =>
        a.warehouseName.localeCompare(b.warehouseName, 'uz'),
      );
    }

    summary.sort((a, b) =>
      a.warehouseName.localeCompare(b.warehouseName, 'uz'),
    );

    return { summary, monthly };
  }

  private async getWarehousesInScope(scope?: UserWarehouseScope) {
    const filter: Record<string, unknown> = { isActive: true };

    if (scope && !scope.allWarehouses) {
      if (scope.warehouseIds.length === 0) {
        return [];
      }
      filter._id = { $in: scope.warehouseIds };
    }

    return this.warehouseModel.find(filter).sort({ name: 1 }).exec();
  }
}
